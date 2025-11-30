import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { cors } from "hono/cors";
import { 
  LoginSchema, 
  LoginResponseSchema, 
  SessionSchema, 
  ServiceAreaSchema, 
  ServiceZoneSchema, 
  MeterBookSchema, 
  MeterSheetSchema, 
  TaskTypeSchema,
  TaskActionSchema,
  AccountTypeSchema,
  TariffChargeCategorySchema,
  MaterialPipelineSchema,
  MeterSizeSchema,
  TariffCategorySchema,
  ReadingCaseSchema,
  ReadingAnomSchema,
  ReadingAnomCaseSchema,
  IncidentTypeSchema,
  MeterReadingSheetSchema,
  MeterReadingAccountSchema
} from "@/shared/types";
import z from "zod";

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

const KIMAWASCO_API_BASE = "https://kimawasco.utilitymis.com/kimapi";

// Login endpoint
app.post("/api/login", zValidator("json", LoginSchema), async (c) => {
  const { username, password } = c.req.valid("json");

  try {
    const response = await fetch(`${KIMAWASCO_API_BASE}/gateman/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const data = await response.json();
    const validatedData = LoginResponseSchema.parse(data);

    // Store session in database
    await c.env.DB.prepare(
      `INSERT INTO sessions (user_id, trongate_user_id, trongate_token, username, employee_name, user_role_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        validatedData.user_id,
        validatedData.trongate_user_id,
        validatedData.trongate_token,
        validatedData.username,
        validatedData.employee_name,
        validatedData.user_role_id
      )
      .run();

    const session: z.infer<typeof SessionSchema> = {
      userId: validatedData.user_id,
      trongateUserId: validatedData.trongate_user_id,
      trongateToken: validatedData.trongate_token,
      username: validatedData.username,
      employeeName: validatedData.employee_name,
      userRoleId: validatedData.user_role_id,
    };

    return c.json(session);
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Login failed" }, 500);
  }
});

// Complete sync operation
app.post("/api/sync/all", zValidator("json", z.object({ userId: z.number(), token: z.string() })), async (c) => {
  const { userId, token } = c.req.valid("json");

  try {
    let totalRecords = 0;
    const headers = { 
      "Content-Type": "application/json",
      "trongateToken": token
    };

    // Sync service areas
    const areasResponse = await fetch(`${KIMAWASCO_API_BASE}/api_get/get_service_areas`, {
      method: "POST",
      headers,
      body: JSON.stringify({ user_id: userId.toString() }),
    });
    
    if (areasResponse.ok) {
      const areasData = await areasResponse.json() as any;
      if (areasData.service_areas) {
        const serviceAreas = z.array(ServiceAreaSchema).parse(areasData.service_areas);
        await c.env.DB.prepare("DELETE FROM service_areas").run();
        for (const area of serviceAreas) {
          await c.env.DB.prepare("INSERT OR REPLACE INTO service_areas (id, name) VALUES (?, ?)")
            .bind(parseInt(area.id), area.name).run();
        }
        totalRecords += serviceAreas.length;

        // Sync zones for each service area
        for (const area of serviceAreas) {
          const zonesResponse = await fetch(`${KIMAWASCO_API_BASE}/api_get/get_service_zones`, {
            method: "POST",
            headers,
            body: JSON.stringify({ parent_id: area.id }),
          });
          
          if (zonesResponse.ok) {
            const zonesData = await zonesResponse.json() as any;
            if (zonesData.service_zones && Array.isArray(zonesData.service_zones)) {
              const zones = z.array(ServiceZoneSchema).parse(zonesData.service_zones);
              for (const zone of zones) {
                await c.env.DB.prepare("INSERT OR REPLACE INTO service_zones (id, name, parent_id) VALUES (?, ?, ?)")
                  .bind(parseInt(zone.id), zone.name, zone.parent_id).run();
              }
              totalRecords += zones.length;
            }
          }
        }
      }
    }

    // Sync meter books and sheets
    const zonesResult = await c.env.DB.prepare("SELECT id FROM service_zones").all();
    if (zonesResult.results && zonesResult.results.length > 0) {
      const zoneIds = zonesResult.results.map((z: any) => z.id);
      const booksResponse = await fetch(`${KIMAWASCO_API_BASE}/api_get/get_meter_books`, {
        method: "POST",
        headers,
        body: JSON.stringify({ zone_ids: zoneIds }),
      });
      
      if (booksResponse.ok) {
        const booksText = await booksResponse.text();
        if (booksText && booksText.trim() !== '') {
          const booksData = JSON.parse(booksText);
          if (booksData.meter_books && Array.isArray(booksData.meter_books)) {
            const books = z.array(MeterBookSchema).parse(booksData.meter_books);
            await c.env.DB.prepare("DELETE FROM meter_books").run();
            for (const book of books) {
              await c.env.DB.prepare("INSERT OR REPLACE INTO meter_books (id, name, service_areas_id) VALUES (?, ?, ?)")
                .bind(parseInt(book.id), book.name, book.service_areas_id).run();
            }
            totalRecords += books.length;

            if (books.length > 0) {
              const bookIds = books.map(b => parseInt(b.id));
              const sheetsResponse = await fetch(`${KIMAWASCO_API_BASE}/api_get/get_meter_sheets`, {
                method: "POST",
                headers,
                body: JSON.stringify({ book_ids: bookIds }),
              });
              
              if (sheetsResponse.ok) {
                const sheetsText = await sheetsResponse.text();
                if (sheetsText && sheetsText.trim() !== '') {
                  const sheetsData = JSON.parse(sheetsText);
                  if (sheetsData.meter_sheets && Array.isArray(sheetsData.meter_sheets)) {
                    const sheets = z.array(MeterSheetSchema).parse(sheetsData.meter_sheets);
                    await c.env.DB.prepare("DELETE FROM meter_sheets").run();
                    for (const sheet of sheets) {
                      await c.env.DB.prepare("INSERT OR REPLACE INTO meter_sheets (id, name, meter_books_id) VALUES (?, ?, ?)")
                        .bind(parseInt(sheet.id), sheet.name, sheet.meter_books_id).run();
                    }
                    totalRecords += sheets.length;
                  }
                }
              }
            }
          }
        }
      }
    }

    // Sync task types
    const taskTypesResponse = await fetch(`${KIMAWASCO_API_BASE}/technician/get_task_types`, {
      method: "POST",
      headers,
    });
    
    if (taskTypesResponse.ok) {
      const taskTypesData = await taskTypesResponse.json() as any;
      if (taskTypesData.field_task_types) {
        const taskTypes = z.array(TaskTypeSchema).parse(taskTypesData.field_task_types);
        await c.env.DB.prepare("DELETE FROM task_types").run();
        for (const taskType of taskTypes) {
          await c.env.DB.prepare("INSERT OR REPLACE INTO task_types (id, name) VALUES (?, ?)")
            .bind(parseInt(taskType.id), taskType.name).run();
        }
        totalRecords += taskTypes.length;
      }
    }

    // Sync task actions
    const taskActionsResponse = await fetch(`${KIMAWASCO_API_BASE}/technician/get_task_actions`, {
      method: "POST",
      headers,
    });
    
    if (taskActionsResponse.ok) {
      const taskActionsData = await taskActionsResponse.json() as any;
      if (taskActionsData.field_task_actions) {
        const taskActions = z.array(TaskActionSchema).parse(taskActionsData.field_task_actions);
        await c.env.DB.prepare("DELETE FROM task_actions").run();
        for (const action of taskActions) {
          await c.env.DB.prepare("INSERT OR REPLACE INTO task_actions (id, name, task_type) VALUES (?, ?, ?)")
            .bind(parseInt(action.id), action.name, action.task_type).run();
        }
        totalRecords += taskActions.length;
      }
    }

    // Sync account types
    const accountTypesResponse = await fetch(`${KIMAWASCO_API_BASE}/api_get/get_account_types`, {
      method: "POST",
      headers,
    });
    
    if (accountTypesResponse.ok) {
      const accountTypesData = await accountTypesResponse.json() as any;
      if (accountTypesData.account_types) {
        const accountTypes = z.array(AccountTypeSchema).parse(accountTypesData.account_types);
        await c.env.DB.prepare("DELETE FROM account_types").run();
        for (const type of accountTypes) {
          await c.env.DB.prepare("INSERT OR REPLACE INTO account_types (id, name) VALUES (?, ?)")
            .bind(parseInt(type.id), type.name).run();
        }
        totalRecords += accountTypes.length;
      }
    }

    // Sync tariff charge categories
    const tariffChargeResponse = await fetch(`${KIMAWASCO_API_BASE}/api_get/get_tariff_charge_categories`, {
      method: "POST",
      headers,
    });
    
    if (tariffChargeResponse.ok) {
      const tariffChargeData = await tariffChargeResponse.json() as any;
      if (tariffChargeData.tariff_charge_categories) {
        const categories = z.array(TariffChargeCategorySchema).parse(tariffChargeData.tariff_charge_categories);
        await c.env.DB.prepare("DELETE FROM tariff_charge_categories").run();
        for (const cat of categories) {
          await c.env.DB.prepare("INSERT OR REPLACE INTO tariff_charge_categories (id, name) VALUES (?, ?)")
            .bind(parseInt(cat.id), cat.name).run();
        }
        totalRecords += categories.length;
      }
    }

    // Sync material pipelines
    const materialsResponse = await fetch(`${KIMAWASCO_API_BASE}/api_get/get_material_pipelines`, {
      method: "POST",
      headers,
    });
    
    if (materialsResponse.ok) {
      const materialsData = await materialsResponse.json() as any;
      if (materialsData.material_pipelines) {
        const materials = z.array(MaterialPipelineSchema).parse(materialsData.material_pipelines);
        await c.env.DB.prepare("DELETE FROM material_pipelines").run();
        for (const mat of materials) {
          await c.env.DB.prepare("INSERT OR REPLACE INTO material_pipelines (id, name) VALUES (?, ?)")
            .bind(parseInt(mat.id), mat.name).run();
        }
        totalRecords += materials.length;
      }
    }

    // Sync meter sizes
    const sizesResponse = await fetch(`${KIMAWASCO_API_BASE}/api_get/get_meter_sizes`, {
      method: "POST",
      headers,
    });
    
    if (sizesResponse.ok) {
      const sizesData = await sizesResponse.json() as any;
      if (sizesData.meter_sizes) {
        const sizes = z.array(MeterSizeSchema).parse(sizesData.meter_sizes);
        await c.env.DB.prepare("DELETE FROM meter_sizes").run();
        for (const size of sizes) {
          await c.env.DB.prepare("INSERT OR REPLACE INTO meter_sizes (id, name) VALUES (?, ?)")
            .bind(parseInt(size.id), size.name).run();
        }
        totalRecords += sizes.length;
      }
    }

    // Sync tariff categories
    const tariffCatResponse = await fetch(`${KIMAWASCO_API_BASE}/api_get/get_tariff_categories`, {
      method: "POST",
      headers,
    });
    
    if (tariffCatResponse.ok) {
      const tariffCatData = await tariffCatResponse.json() as any;
      if (tariffCatData.tariff_categories) {
        const categories = z.array(TariffCategorySchema).parse(tariffCatData.tariff_categories);
        await c.env.DB.prepare("DELETE FROM tariff_categories").run();
        for (const cat of categories) {
          await c.env.DB.prepare("INSERT OR REPLACE INTO tariff_categories (id, name) VALUES (?, ?)")
            .bind(parseInt(cat.id), cat.name || '').run();
        }
        totalRecords += categories.length;
      }
    }

    // Sync reading cases
    const readingCasesResponse = await fetch(`${KIMAWASCO_API_BASE}/meter_reader/get_reading_cases`, {
      method: "POST",
      headers,
    });
    
    if (readingCasesResponse.ok) {
      const readingCasesData = await readingCasesResponse.json() as any;
      if (readingCasesData.reading_cases) {
        const cases = z.array(ReadingCaseSchema).parse(readingCasesData.reading_cases);
        await c.env.DB.prepare("DELETE FROM reading_cases").run();
        for (const rCase of cases) {
          await c.env.DB.prepare("INSERT OR REPLACE INTO reading_cases (id, name, has_reading, has_image) VALUES (?, ?, ?, ?)")
            .bind(parseInt(rCase.id), rCase.name, parseInt(rCase.has_reading), parseInt(rCase.has_image)).run();
        }
        totalRecords += cases.length;
      }
    }

    // Sync reading anomalies
    const readingAnomResponse = await fetch(`${KIMAWASCO_API_BASE}/meter_reader/get_reading_anom`, {
      method: "POST",
      headers,
    });
    
    if (readingAnomResponse.ok) {
      const readingAnomData = await readingAnomResponse.json() as any;
      if (readingAnomData.reading_anom) {
        const anoms = z.array(ReadingAnomSchema).parse(readingAnomData.reading_anom);
        await c.env.DB.prepare("DELETE FROM reading_anom").run();
        for (const anom of anoms) {
          await c.env.DB.prepare("INSERT OR REPLACE INTO reading_anom (id, name, description) VALUES (?, ?, ?)")
            .bind(parseInt(anom.id), anom.name, anom.description).run();
        }
        totalRecords += anoms.length;
      }
    }

    // Sync reading anomaly cases
    const readingAnomCasesResponse = await fetch(`${KIMAWASCO_API_BASE}/meter_reader/get_reading_anom_cases`, {
      method: "POST",
      headers,
    });
    
    if (readingAnomCasesResponse.ok) {
      const readingAnomCasesData = await readingAnomCasesResponse.json() as any;
      if (readingAnomCasesData.reading_anom_cases) {
        const anomCases = z.array(ReadingAnomCaseSchema).parse(readingAnomCasesData.reading_anom_cases);
        await c.env.DB.prepare("DELETE FROM reading_anom_cases").run();
        for (const anomCase of anomCases) {
          await c.env.DB.prepare("INSERT OR REPLACE INTO reading_anom_cases (id, name, case_id) VALUES (?, ?, ?)")
            .bind(parseInt(anomCase.id), anomCase.name, parseInt(anomCase.case_id)).run();
        }
        totalRecords += anomCases.length;
      }
    }

    // Sync incident types
    const incidentTypesResponse = await fetch(`${KIMAWASCO_API_BASE}/api_get/get_incidents`, {
      method: "POST",
      headers,
    });
    
    if (incidentTypesResponse.ok) {
      const incidentTypesData = await incidentTypesResponse.json() as any;
      if (incidentTypesData.report_incidents) {
        const incidentTypes = z.array(IncidentTypeSchema).parse(incidentTypesData.report_incidents);
        await c.env.DB.prepare("DELETE FROM incident_types").run();
        for (const type of incidentTypes) {
          await c.env.DB.prepare("INSERT OR REPLACE INTO incident_types (id, name) VALUES (?, ?)")
            .bind(parseInt(type.id), type.name).run();
        }
        totalRecords += incidentTypes.length;
      }
    }

    await c.env.DB.prepare(
      "INSERT INTO sync_history (sync_type, records_synced, is_success) VALUES (?, ?, ?)"
    ).bind("complete_sync", totalRecords, 1).run();

    return c.json({ success: true, message: "All data synced successfully", records: totalRecords });
  } catch (error) {
    console.error("Complete sync error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await c.env.DB.prepare(
      "INSERT INTO sync_history (sync_type, records_synced, is_success, error_message) VALUES (?, ?, ?, ?)"
    ).bind("complete_sync", 0, 0, errorMessage).run();
    return c.json({ error: "Sync failed", details: errorMessage }, 500);
  }
});

// Get meter reading sheets for user
app.get("/api/meter-reading/sheets", async (c) => {
  const userId = c.req.query("userId");
  const token = c.req.query("token");
  
  if (!userId || !token) {
    return c.json({ error: "User ID and token required" }, 400);
  }

  try {
    const response = await fetch(`${KIMAWASCO_API_BASE}/meter_reader/get_assigned_sheets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "trongateToken": token,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      return c.json({ error: "Failed to fetch sheets" }, 500);
    }

    const data = await response.json() as any;
    if (data.meter_sheets) {
      const sheets = z.array(MeterReadingSheetSchema).parse(data.meter_sheets);
      
      // Store sheets locally
      await c.env.DB.prepare("DELETE FROM meter_reading_sheets WHERE user_id = ?").bind(parseInt(userId)).run();
      
      for (const sheet of sheets) {
        await c.env.DB.prepare(
          `INSERT INTO meter_reading_sheets (id, sheet, assigned, returned, date_due, is_active, is_closed, user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          parseInt(sheet.id),
          sheet.sheet,
          parseInt(sheet.assigned),
          parseInt(sheet.returned),
          sheet.date_due,
          parseInt(sheet.active),
          parseInt(sheet.closed),
          parseInt(userId)
        ).run();
      }

      const result = await c.env.DB.prepare(
        `SELECT id, sheet, assigned, returned, date_due as dateDue, is_active as isActive, is_closed as isClosed, user_id as userId
         FROM meter_reading_sheets WHERE user_id = ?`
      ).bind(parseInt(userId)).all();

      return c.json(result.results || []);
    }

    return c.json([]);
  } catch (error) {
    console.error("Failed to fetch meter reading sheets:", error);
    return c.json({ error: "Failed to fetch sheets" }, 500);
  }
});

// Get meter reading accounts for sheet
app.get("/api/meter-reading/accounts", async (c) => {
  const userId = c.req.query("userId");
  const sheetId = c.req.query("sheetId");
  const token = c.req.query("token");
  
  if (!userId || !sheetId || !token) {
    return c.json({ error: "User ID, sheet ID and token required" }, 400);
  }

  try {
    const response = await fetch(`${KIMAWASCO_API_BASE}/meter_reader/meters_assigned`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "trongateToken": token,
      },
      body: JSON.stringify({ 
        user_id: userId,
        assigned_id: sheetId 
      }),
    });

    if (!response.ok) {
      return c.json({ error: "Failed to fetch accounts" }, 500);
    }

    const data = await response.json() as any;
    if (data.accounts) {
      const accounts = z.array(MeterReadingAccountSchema).parse(data.accounts);
      
      // Store accounts locally
      await c.env.DB.prepare("DELETE FROM meter_reading_accounts WHERE sheet_id = ?").bind(parseInt(sheetId)).run();
      
      for (const account of accounts) {
        await c.env.DB.prepare(
          `INSERT INTO meter_reading_accounts 
           (id, account_number, meters_id, meter_no, location, assoc_name, assoc_phone, assoc_email, accounts_id, 
            prev_read, prev_date, last_date, status_id, geolat, geolon, connection, acc_balance, walk_no, sheet_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          parseInt(account.id),
          account.account_number,
          parseInt(account.meters_id),
          account.meter_no,
          account.Location,
          account.assoc_name,
          account.assoc_phone,
          account.assoc_email,
          parseInt(account.accounts_id),
          account.prev_read,
          account.prev_date,
          account.last_date,
          parseInt(account.status_id),
          account.geolat,
          account.geolon,
          parseInt(account.connection),
          parseFloat(account.acc_balance),
          account.walk_no,
          parseInt(sheetId)
        ).run();
      }

      const result = await c.env.DB.prepare(
        `SELECT id, account_number as accountNumber, meters_id as metersId, meter_no as meterNo, location,
         assoc_name as assocName, assoc_phone as assocPhone, assoc_email as assocEmail, accounts_id as accountsId,
         prev_read as prevRead, prev_date as prevDate, last_date as lastDate, status_id as statusId,
         geolat, geolon, connection, acc_balance as accBalance, walk_no as walkNo, sheet_id as sheetId
         FROM meter_reading_accounts WHERE sheet_id = ?
         ORDER BY walk_no ASC NULLS LAST, account_number ASC`
      ).bind(parseInt(sheetId)).all();

      return c.json(result.results || []);
    }

    return c.json([]);
  } catch (error) {
    console.error("Failed to fetch meter reading accounts:", error);
    return c.json({ error: "Failed to fetch accounts" }, 500);
  }
});

// Save meter reading capture
app.post("/api/meter-reading/capture", async (c) => {
  try {
    const body = await c.req.json();
    
    const result = await c.env.DB.prepare(
      `INSERT INTO meter_reading_captures 
        (account_id, sheet_id, user_id, case_id, current_reading, meter_number, anomaly_id, anomaly_case_id, 
         photo_url, latitude, longitude, accuracy, reading_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.accountId,
      body.sheetId,
      body.userId,
      body.caseId,
      body.currentReading || null,
      body.meterNumber || null,
      body.anomalyId || null,
      body.anomalyCaseId || null,
      body.photoUrl || null,
      body.latitude,
      body.longitude,
      body.accuracy || null,
      body.readingDate
    ).run();

    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    console.error("Failed to save meter reading capture:", error);
    return c.json({ error: "Failed to save reading" }, 500);
  }
});

// Get reading cases
app.get("/api/reading-cases", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT id, name, has_reading as hasReading, has_image as hasImage FROM reading_cases`
    ).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error("Failed to fetch reading cases:", error);
    return c.json({ error: "Failed to fetch cases" }, 500);
  }
});

// Get reading anomalies
app.get("/api/reading-anomalies", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT id, name, description FROM reading_anom`
    ).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error("Failed to fetch anomalies:", error);
    return c.json({ error: "Failed to fetch anomalies" }, 500);
  }
});

// Get reading anomaly cases
app.get("/api/reading-anomaly-cases", async (c) => {
  const caseId = c.req.query("caseId");
  
  try {
    let query = "SELECT id, name, case_id as caseId FROM reading_anom_cases";
    const params: any[] = [];
    
    if (caseId) {
      query += " WHERE case_id = ?";
      params.push(parseInt(caseId));
    }
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error("Failed to fetch anomaly cases:", error);
    return c.json({ error: "Failed to fetch cases" }, 500);
  }
});

// Get incident types
app.get("/api/incident-types", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT id, name FROM incident_types`
    ).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error("Failed to fetch incident types:", error);
    return c.json({ error: "Failed to fetch types" }, 500);
  }
});

// Get tasks for user
app.get("/api/tasks", async (c) => {
  const userId = c.req.query("userId");
  
  if (!userId) {
    return c.json({ error: "User ID required" }, 400);
  }

  try {
    const result = await c.env.DB.prepare(
      `SELECT 
        id, external_id as externalId, user_id as userId, task_type_id as taskTypeId,
        title, description, status, priority, customer_name as customerName,
        customer_account as customerAccount, location_address as locationAddress,
        latitude, longitude, assigned_date as assignedDate, due_date as dueDate,
        completed_date as completedDate, notes, created_at as createdAt, updated_at as updatedAt
      FROM tasks WHERE user_id = ?
      ORDER BY created_at DESC`
    ).bind(parseInt(userId)).all();

    return c.json(result.results || []);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return c.json({ error: "Failed to fetch tasks" }, 500);
  }
});

// Create meter reading
app.post("/api/meter-readings", async (c) => {
  try {
    const body = await c.req.json();
    
    const result = await c.env.DB.prepare(
      `INSERT INTO meter_readings 
        (user_id, meter_number, current_reading, reading_date, meter_status, notes, latitude, longitude, photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.userId,
      body.meterNumber,
      body.currentReading,
      body.readingDate,
      body.meterStatus,
      body.notes || null,
      body.latitude || null,
      body.longitude || null,
      body.photoUrl || null
    ).run();

    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    console.error("Failed to create meter reading:", error);
    return c.json({ error: "Failed to save meter reading" }, 500);
  }
});

// Create incident
app.post("/api/incidents", async (c) => {
  try {
    const body = await c.req.json();
    
    const result = await c.env.DB.prepare(
      `INSERT INTO incidents 
        (user_id, type_id, incident_type, title, description, severity, status, customer_account, 
         meter_number, location_address, landmark, contact_name, contact_phone, latitude, longitude, reported_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.userId,
      body.typeId || null,
      body.incidentType,
      body.title,
      body.description,
      body.severity,
      body.status,
      body.customerAccount || null,
      body.meterNumber || null,
      body.locationAddress || null,
      body.landmark || null,
      body.contactName || null,
      body.contactPhone || null,
      body.latitude || null,
      body.longitude || null,
      body.reportedDate
    ).run();

    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    console.error("Failed to create incident:", error);
    return c.json({ error: "Failed to report incident" }, 500);
  }
});

// Upload image
app.post("/api/upload/image", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "images";
    
    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    const filename = `${folder}/${Date.now()}_${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    
    await c.env.R2_BUCKET.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    return c.json({ 
      success: true, 
      url: `/api/files/${encodeURIComponent(filename)}`,
      filename 
    });
  } catch (error) {
    console.error("Failed to upload image:", error);
    return c.json({ error: "Failed to upload image" }, 500);
  }
});

// Get uploaded file
app.get("/api/files/:filename{.+}", async (c) => {
  const filename = c.req.param("filename");
  
  try {
    const object = await c.env.R2_BUCKET.get(decodeURIComponent(filename));
    
    if (!object) {
      return c.json({ error: "File not found" }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    
    return c.body(object.body, { headers });
  } catch (error) {
    console.error("Failed to retrieve file:", error);
    return c.json({ error: "Failed to retrieve file" }, 500);
  }
});

// Search customers
app.get("/api/customers/search", async (c) => {
  const type = c.req.query("type");
  const term = c.req.query("term");
  
  if (!type || !term) {
    return c.json({ error: "Search type and term required" }, 400);
  }

  try {
    let query = "";
    const searchTerm = `%${term}%`;

    switch (type) {
      case "account":
        query = "SELECT * FROM customers WHERE account_number LIKE ? LIMIT 20";
        break;
      case "name":
        query = "SELECT * FROM customers WHERE name LIKE ? LIMIT 20";
        break;
      case "meter":
        query = "SELECT * FROM customers WHERE meter_number LIKE ? LIMIT 20";
        break;
      default:
        return c.json({ error: "Invalid search type" }, 400);
    }

    const result = await c.env.DB.prepare(query).bind(searchTerm).all();
    
    const customers = (result.results || []).map((row: any) => ({
      id: row.id,
      accountNumber: row.account_number,
      name: row.name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      meterNumber: row.meter_number,
      serviceAreaId: row.service_area_id,
      serviceZoneId: row.service_zone_id,
      meterBookId: row.meter_book_id,
      meterSheetId: row.meter_sheet_id,
      connectionStatus: row.connection_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return c.json(customers);
  } catch (error) {
    console.error("Customer search failed:", error);
    return c.json({ error: "Search failed" }, 500);
  }
});

// Get dashboard stats
app.get("/api/dashboard/stats", async (c) => {
  const userId = c.req.query("userId");
  
  if (!userId) {
    return c.json({ error: "User ID required" }, 400);
  }

  try {
    const pendingResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'pending'"
    ).bind(parseInt(userId)).first();

    const today = new Date().toISOString().split('T')[0];
    const completedResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'completed' AND DATE(completed_date) = ?"
    ).bind(parseInt(userId), today).first();

    const syncResult = await c.env.DB.prepare(
      "SELECT created_at FROM sync_history WHERE is_success = 1 ORDER BY created_at DESC LIMIT 1"
    ).first();

    return c.json({
      pendingTasks: pendingResult?.count || 0,
      completedToday: completedResult?.count || 0,
      lastSync: syncResult?.created_at || null,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

// Get sync history
app.get("/api/sync/history", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT 
        id, sync_type as syncType, records_synced as recordsSynced,
        is_success as isSuccess, error_message as errorMessage, created_at as createdAt
      FROM sync_history
      ORDER BY created_at DESC
      LIMIT 50`
    ).all();

    return c.json(result.results || []);
  } catch (error) {
    console.error("Failed to fetch sync history:", error);
    return c.json({ error: "Failed to fetch sync history" }, 500);
  }
});

// Clear local data
app.post("/api/data/clear", async (c) => {
  try {
    await c.env.DB.prepare("DELETE FROM tasks").run();
    await c.env.DB.prepare("DELETE FROM meter_readings").run();
    await c.env.DB.prepare("DELETE FROM incidents").run();
    await c.env.DB.prepare("DELETE FROM task_attachments").run();
    await c.env.DB.prepare("DELETE FROM incident_attachments").run();
    await c.env.DB.prepare("DELETE FROM meter_reading_captures").run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to clear data:", error);
    return c.json({ error: "Failed to clear data" }, 500);
  }
});

// Upload tasks
app.post("/api/tasks/upload", async (c) => {
  try {
    const body = await c.req.json();
    const { taskIds } = body;

    for (const taskId of taskIds) {
      await c.env.DB.prepare(
        "UPDATE tasks SET status = 'uploaded', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(taskId).run();
    }

    return c.json({ success: true, count: taskIds.length });
  } catch (error) {
    console.error("Failed to upload tasks:", error);
    return c.json({ error: "Failed to upload tasks" }, 500);
  }
});

export default app;
