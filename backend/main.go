// Файл: D:/SPOkursach/project/backend/main.go
package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var db *pgxpool.Pool

// --- Модели (с ответами) ---
type Car struct {
	ID                      string  `json:"id"`
	Make                    string  `json:"make"`
	Model                   string  `json:"model"`
	Year                    int     `json:"year"`
	PlateNumber             string  `json:"plate_number"`
	Color                   *string `json:"color"`
	VIN                     *string `json:"vin"`
	Status                  string  `json:"status"`
	AssignedDriverID        *string `json:"assigned_driver_id"`
	InsuranceExpiry         *string `json:"insurance_expiry"`
	TechInspectionExpiry    *string `json:"tech_inspection_expiry"`
	MedicalInspectionExpiry *string `json:"medical_inspection_expiry"`
	CreatedAt               string  `json:"created_at"`
}

type Driver struct {
	ID            string  `json:"id"`
	FullName      string  `json:"full_name"`
	Email         string  `json:"email"`
	Phone         string  `json:"phone"`
	Role          string  `json:"role"`
	IsActive      bool    `json:"is_active"`
	CreatedAt     string  `json:"created_at"`
	AssignedCarID *string `json:"assigned_car_id"`
}

type Log struct {
	ID          string  `json:"id"`
	DriverID    string  `json:"driver_id"`
	Date        string  `json:"date"`
	StartTime   string  `json:"start_time"`
	EndTime     string  `json:"end_time"`
	Revenue     float64 `json:"revenue"`
	TripsCount  int     `json:"trips_count"`
	HadAccident bool    `json:"had_accident"`
	Notes       string  `json:"notes"`
	CreatedAt   string  `json:"created_at"`
}

// --- CORS Middleware ---
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allowed := []string{"http://localhost", "http://localhost:5173", "http://localhost:80", "http://127.0.0.1"}
		for _, a := range allowed {
			if origin == a {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
func respondError(w http.ResponseWriter, status int, msg string) {
	respondJSON(w, status, map[string]string{"error": msg})
}

// --- Handlers: Health ---
func pingHandler(w http.ResponseWriter, r *http.Request) {
	if err := db.Ping(r.Context()); err != nil {
		respondError(w, 500, "DB error")
		return
	}
	respondJSON(w, 200, map[string]string{"status": "ok"})
}

// --- Handlers: Cars ---
func getCarsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(r.Context(), `
		SELECT id, make, model, year, plate_number, color, vin, status, 
		       assigned_driver_id, 
		       to_char(insurance_expiry, 'YYYY-MM-DD'),
		       to_char(tech_inspection_expiry, 'YYYY-MM-DD'),
		       to_char(medical_inspection_expiry, 'YYYY-MM-DD'),
		       to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		FROM cars ORDER BY created_at DESC`)
	if err != nil {
		log.Println("❌ DB error:", err)
		respondError(w, 500, "DB error")
		return
	}
	defer rows.Close()
	var cars []Car
	for rows.Next() {
		var c Car
		err := rows.Scan(&c.ID, &c.Make, &c.Model, &c.Year, &c.PlateNumber,
			&c.Color, &c.VIN, &c.Status, &c.AssignedDriverID,
			&c.InsuranceExpiry, &c.TechInspectionExpiry, &c.MedicalInspectionExpiry, &c.CreatedAt)
		if err != nil {
			log.Println("❌ Scan error:", err)
			continue
		}
		cars = append(cars, c)
	}
	respondJSON(w, 200, cars)
}

// 🔥 ИСПРАВЛЕНО: Добавлены JSON-теги для запроса
func addCarHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Make                    string  `json:"make"`
		Model                   string  `json:"model"`
		PlateNumber             string  `json:"plate_number"`  // ← КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ
		Year                    int     `json:"year"`
		Color                   *string `json:"color"`
		VIN                     *string `json:"vin"`
		InsuranceExpiry         *string `json:"insurance_expiry"`
		TechInspectionExpiry    *string `json:"tech_inspection_expiry"`
		MedicalInspectionExpiry *string `json:"medical_inspection_expiry"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("❌ JSON decode error:", err)
		respondError(w, 400, "Invalid JSON: "+err.Error())
		return
	}
	
	log.Printf("📦 Received car: %+v", req) // 🔍 Лог для отладки

	_, err := db.Exec(r.Context(), `
		INSERT INTO cars (make, model, year, plate_number, color, vin, status, 
			insurance_expiry, tech_inspection_expiry, medical_inspection_expiry, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,'active',$7,$8,$9,NOW())`,
		req.Make, req.Model, req.Year, req.PlateNumber, req.Color, req.VIN,
		req.InsuranceExpiry, req.TechInspectionExpiry, req.MedicalInspectionExpiry)
	if err != nil {
		log.Println("❌ Insert error:", err)
		respondError(w, 500, "Insert error: "+err.Error())
		return
	}
	log.Println("✅ Car created:", req.PlateNumber)
	respondJSON(w, 201, map[string]string{"status": "created"})
}

func assignCarHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CarID    string `json:"car_id"`
		DriverID string `json:"driver_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, 400, "Invalid JSON")
		return
	}
	var exists bool
	db.QueryRow(r.Context(), "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)", req.DriverID).Scan(&exists)
	if !exists {
		respondError(w, 404, "Driver not found")
		return
	}
	_, err := db.Exec(r.Context(), `UPDATE cars SET assigned_driver_id = $1 WHERE id = $2`, req.DriverID, req.CarID)
	if err != nil {
		log.Println("❌ Assign error:", err)
		respondError(w, 500, "Assign error: "+err.Error())
		return
	}
	log.Println("✅ Car assigned:", req.CarID, "→", req.DriverID)
	respondJSON(w, 200, map[string]string{"status": "assigned"})
}

func unassignCarHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CarID string `json:"car_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, 400, "Invalid JSON")
		return
	}
	_, err := db.Exec(r.Context(), `UPDATE cars SET assigned_driver_id = NULL WHERE id = $1`, req.CarID)
	if err != nil {
		log.Println("❌ Unassign error:", err)
		respondError(w, 500, "Unassign error: "+err.Error())
		return
	}
	log.Println("✅ Car unassigned:", req.CarID)
	respondJSON(w, 200, map[string]string{"status": "unassigned"})
}

func updateCarStatusHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CarID  string `json:"car_id"`
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, 400, "Invalid JSON")
		return
	}
	_, err := db.Exec(r.Context(), `UPDATE cars SET status = $1 WHERE id = $2`, req.Status, req.CarID)
	if err != nil {
		log.Println("❌ Update error:", err)
		respondError(w, 500, "Update error: "+err.Error())
		return
	}
	log.Println("✅ Car status updated:", req.CarID, "→", req.Status)
	respondJSON(w, 200, map[string]string{"status": "updated"})
}

// --- Handlers: Drivers / Auth ---
func getDriversHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(r.Context(), `
		SELECT id, full_name, email, phone, role, is_active, 
		       to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
		       (SELECT id FROM cars WHERE assigned_driver_id = users.id AND status='active' LIMIT 1)
		FROM users WHERE role='driver' ORDER BY created_at DESC`)
	if err != nil {
		log.Println("❌ DB error:", err)
		respondError(w, 500, "DB error")
		return
	}
	defer rows.Close()
	var drivers []Driver
	for rows.Next() {
		var d Driver
		err := rows.Scan(&d.ID, &d.FullName, &d.Email, &d.Phone, &d.Role, &d.IsActive, &d.CreatedAt, &d.AssignedCarID)
		if err != nil {
			log.Println("❌ Scan error:", err)
			continue
		}
		drivers = append(drivers, d)
	}
	respondJSON(w, 200, drivers)
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email, Password, FullName, Phone, Role string
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, 400, "Invalid JSON")
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, 500, "Hash error")
		return
	}
	var id string
	err = db.QueryRow(r.Context(), `
		INSERT INTO users (email, password_hash, full_name, phone, role, is_active, created_at)
		VALUES ($1,$2,$3,$4,$5,true,NOW()) RETURNING id`,
		req.Email, string(hash), req.FullName, req.Phone, req.Role).Scan(&id)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate") {
			respondError(w, 409, "Email exists")
		} else {
			respondError(w, 500, "Register error")
		}
		return
	}
	log.Println("✅ User registered:", id)
	respondJSON(w, 201, map[string]string{"status": "registered", "user_id": id})
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email, Password string
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, 400, "Invalid JSON")
		return
	}
	var userID, role, fullName, phone, passwordHash, createdAt string
	err := db.QueryRow(r.Context(), `
		SELECT id, password_hash, full_name, phone, role, to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		FROM users WHERE email = $1 AND is_active = true`,
		req.Email).Scan(&userID, &passwordHash, &fullName, &phone, &role, &createdAt)
	if err != nil {
		respondError(w, 401, "Invalid credentials")
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		respondError(w, 401, "Invalid credentials")
		return
	}
	log.Println("✅ User logged in:", userID)
	respondJSON(w, 200, map[string]interface{}{
		"status": "ok", "user_id": userID, "email": req.Email,
		"full_name": fullName, "phone": phone, "role": role,
	})
}

// --- Handlers: Logs ---
func getLogsHandler(w http.ResponseWriter, r *http.Request) {
	driverID := r.URL.Query().Get("driver_id")
	query := `SELECT id, driver_id, date, start_time, end_time, revenue, trips_count, had_accident, notes, 
	                 to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at FROM logs`
	args := []interface{}{}
	if driverID != "" {
		query += " WHERE driver_id = $1"
		args = append(args, driverID)
	}
	query += " ORDER BY date DESC"
	rows, err := db.Query(r.Context(), query, args...)
	if err != nil {
		log.Println("❌ DB error:", err)
		respondError(w, 500, "DB error")
		return
	}
	defer rows.Close()
	var logs []Log
	for rows.Next() {
		var l Log
		rows.Scan(&l.ID, &l.DriverID, &l.Date, &l.StartTime, &l.EndTime,
			&l.Revenue, &l.TripsCount, &l.HadAccident, &l.Notes, &l.CreatedAt)
		logs = append(logs, l)
	}
	respondJSON(w, 200, logs)
}

func addLogHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		DriverID    string  `json:"driver_id"`
		Date        string  `json:"date"`
		StartTime   string  `json:"start_time"`
		EndTime     string  `json:"end_time"`
		Revenue     float64 `json:"revenue"`
		TripsCount  int     `json:"trips_count"`
		HadAccident bool    `json:"had_accident"`
		Notes       string  `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, 400, "Invalid JSON")
		return
	}
	_, err := db.Exec(r.Context(), `
		INSERT INTO logs (driver_id, date, start_time, end_time, revenue, trips_count, had_accident, notes, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
		req.DriverID, req.Date, req.StartTime, req.EndTime, req.Revenue, req.TripsCount, req.HadAccident, req.Notes)
	if err != nil {
		log.Println("❌ Insert log error:", err)
		respondError(w, 500, "Insert error")
		return
	}
	respondJSON(w, 201, map[string]string{"status": "created"})
}

// --- Main ---
func main() {
	ctx := context.Background()
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		connStr = "postgres://postgres:postgres123@postgres:5432/taxopark?sslmode=disable"
	}
	var err error
	db, err = pgxpool.New(ctx, connStr)
	if err != nil {
		log.Fatal("DB connect failed:", err)
	}
	defer db.Close()
	if err := db.Ping(ctx); err != nil {
		log.Println("⚠️ DB ping warning:", err)
	} else {
		log.Println("✅ Connected to PostgreSQL")
	}

	mux := http.NewServeMux()

	// === 🔥 РЕГИСТРАЦИЯ МАРШРУТОВ ===
	// 🚗 Cars
	mux.HandleFunc("/api/cars", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			getCarsHandler(w, r)
		} else if r.Method == http.MethodPost {
			addCarHandler(w, r)
		} else {
			respondError(w, 405, "Method not allowed")
		}
	})
	mux.HandleFunc("/api/cars/assign", assignCarHandler)
	mux.HandleFunc("/api/cars/unassign", unassignCarHandler)
	mux.HandleFunc("/api/cars/status", updateCarStatusHandler)

	// 👥 Drivers / Auth
	mux.HandleFunc("/api/drivers", getDriversHandler)
	mux.HandleFunc("/api/auth/register", registerHandler)
	mux.HandleFunc("/api/auth/login", loginHandler)

	// 📝 Logs
	mux.HandleFunc("/api/logs", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			getLogsHandler(w, r)
		} else if r.Method == http.MethodPost {
			addLogHandler(w, r)
		} else {
			respondError(w, 405, "Method not allowed")
		}
	})

	// ❤️ Health
	mux.HandleFunc("/api/ping", pingHandler)

	log.Println("🚀 API running on :8080")
	log.Fatal(http.ListenAndServe(":8080", corsMiddleware(mux)))
}