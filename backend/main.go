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

// --- Модели данных ---
type Car struct {
	ID                   string  `json:"id"`
	Make                 string  `json:"make"`
	Model                string  `json:"model"`
	Year                 int     `json:"year"`
	PlateNumber          string  `json:"plate_number"`
	Color                *string `json:"color"`
	VIN                  *string `json:"vin"`
	Status               string  `json:"status"`
	AssignedDriverID     *string `json:"assigned_driver_id"`
	DriverName           *string `json:"driver_name,omitempty"`
	InsuranceExpiry      *string `json:"insurance_expiry,omitempty"`
	TechInspectionExpiry *string `json:"tech_inspection_expiry,omitempty"`
	CreatedAt            string  `json:"created_at"`
}

type Driver struct {
	ID             string  `json:"id"`
	FullName       string  `json:"full_name"`
	Email          string  `json:"email"`
	Phone          string  `json:"phone"`
	Role           string  `json:"role"`
	IsActive       bool    `json:"is_active"`
	CreatedAt      string  `json:"created_at"`
	AssignedCarID  *string `json:"assigned_car_id"`
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
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// --- Helpers ---
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("❌ JSON encode error: %v", err)
	}
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

// --- Handlers: Cars ---
func getCarsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(r.Context(), `
		SELECT c.id, c.make, c.model, c.year, c.plate_number, c.color, c.vin, c.status, 
		       c.assigned_driver_id, c.insurance_expiry, c.tech_inspection_expiry, 
		       to_char(c.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
		       p.full_name as driver_name
		FROM cars c 
		LEFT JOIN users p ON c.assigned_driver_id = p.id
		ORDER BY c.created_at DESC
	`)
	if err != nil {
		log.Printf("❌ DB query error: %v", err)
		respondError(w, http.StatusInternalServerError, "DB error")
		return
	}
	defer rows.Close()

	var cars []Car
	for rows.Next() {
		var car Car
		var color, vin, assignedDriverID, insuranceExpiry, techInspectionExpiry, driverName *string
		var createdAt string
		
		err := rows.Scan(
			&car.ID, &car.Make, &car.Model, &car.Year, &car.PlateNumber,
			&color, &vin, &car.Status, &assignedDriverID,
			&insuranceExpiry, &techInspectionExpiry, &createdAt,
			&driverName,
		)
		if err != nil {
			log.Printf("❌ Scan error: %v", err)
			respondError(w, http.StatusInternalServerError, "Scan error")
			return
		}
		
		car.Color = color
		car.VIN = vin
		car.AssignedDriverID = assignedDriverID
		car.InsuranceExpiry = insuranceExpiry
		car.TechInspectionExpiry = techInspectionExpiry
		car.CreatedAt = createdAt
		car.DriverName = driverName
		
		cars = append(cars, car)
	}
	respondJSON(w, http.StatusOK, cars)
}

func addCarHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Make        string  `json:"make"`
		Model       string  `json:"model"`
		Year        int     `json:"year"`
		PlateNumber string  `json:"plate_number"`
		Color       *string `json:"color"`
		VIN         *string `json:"vin"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	_, err := db.Exec(r.Context(), `
		INSERT INTO cars (make, model, year, plate_number, color, vin, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())
	`, req.Make, req.Model, req.Year, req.PlateNumber, req.Color, req.VIN)

	if err != nil {
		log.Printf("❌ Insert error: %v", err)
		respondError(w, http.StatusInternalServerError, "Insert error")
		return
	}
	respondJSON(w, http.StatusCreated, map[string]string{"status": "created"})
}

func assignCarHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CarID    string `json:"car_id"`
		DriverID string `json:"driver_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	log.Printf("🔗 Assign request: car_id=%s, driver_id=%s", req.CarID, req.DriverID)

	result, err := db.Exec(r.Context(), `
		UPDATE cars SET assigned_driver_id = $1 WHERE id = $2
	`, req.DriverID, req.CarID)
	
	if err != nil {
		log.Printf("❌ DB Exec error: %v", err)
		respondError(w, http.StatusInternalServerError, "Assign error: "+err.Error())
		return
	}
	
	log.Printf("✅ Rows affected: %d", result.RowsAffected())
	respondJSON(w, http.StatusOK, map[string]string{"status": "assigned"})
}

func unassignCarHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CarID string `json:"car_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	_, err := db.Exec(r.Context(), `UPDATE cars SET assigned_driver_id = NULL WHERE id = $1`, req.CarID)
	if err != nil {
		log.Printf("❌ Unassign error: %v", err)
		respondError(w, http.StatusInternalServerError, "Unassign error")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "unassigned"})
}

func updateCarStatusHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CarID  string `json:"car_id"`
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	_, err := db.Exec(r.Context(), `UPDATE cars SET status = $1 WHERE id = $2`, req.Status, req.CarID)
	if err != nil {
		log.Printf("❌ Update status error: %v", err)
		respondError(w, http.StatusInternalServerError, "Update error")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

// --- Handlers: Drivers / Auth ---
func getDriversHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(r.Context(), `
		SELECT 
			u.id, 
			u.full_name, 
			u.email, 
			u.phone, 
			u.role, 
			u.is_active,
			to_char(u.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
			(
				SELECT c.id FROM cars c 
				WHERE c.assigned_driver_id = u.id AND c.status = 'active'
				LIMIT 1
			) as assigned_car_id
		FROM users u 
		WHERE u.role = 'driver'
		ORDER BY u.created_at DESC
	`)
	if err != nil {
		log.Printf("❌ DB query error: %v", err)
		respondError(w, http.StatusInternalServerError, "DB error")
		return
	}
	defer rows.Close()

	var drivers []Driver
	for rows.Next() {
		var d Driver
		var assignedCarID *string
		
		err := rows.Scan(
			&d.ID, &d.FullName, &d.Email, &d.Phone, &d.Role, &d.IsActive, &d.CreatedAt,
			&assignedCarID,
		)
		if err != nil {
			log.Printf("❌ Scan error: %v", err)
			respondError(w, http.StatusInternalServerError, "Scan error")
			return
		}
		
		d.AssignedCarID = assignedCarID
		drivers = append(drivers, d)
	}
	respondJSON(w, http.StatusOK, drivers)
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		FullName string `json:"full_name"`
		Phone    string `json:"phone"`
		Role     string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("❌ Hash error: %v", err)
		respondError(w, http.StatusInternalServerError, "Hash error")
		return
	}

	var userID string
	err = db.QueryRow(r.Context(), `
		INSERT INTO users (email, password_hash, full_name, phone, role, is_active, created_at)
		VALUES ($1, $2, $3, $4, $5, true, NOW())
		RETURNING id
	`, req.Email, string(hash), req.FullName, req.Phone, req.Role).Scan(&userID)

	if err != nil {
		log.Printf("❌ DB insert error: %v", err)
		if strings.Contains(err.Error(), "duplicate") {
			respondError(w, http.StatusConflict, "Email already exists")
		} else {
			respondError(w, http.StatusInternalServerError, "Registration failed")
		}
		return
	}

	log.Println("✅ User registered:", userID)
	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"status":  "registered",
		"user_id": userID,
		"email":   req.Email,
		"role":    req.Role,
	})
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	var userID, role, fullName, phone, passwordHash string
	var createdAt string
	
	err := db.QueryRow(r.Context(), `
		SELECT id, password_hash, full_name, phone, role, 
		       to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
		FROM users WHERE email = $1 AND is_active = true
	`, req.Email).Scan(&userID, &passwordHash, &fullName, &phone, &role, &createdAt)

	if err != nil {
		if err.Error() == "no rows in result set" {
			respondError(w, http.StatusUnauthorized, "Invalid credentials")
		} else {
			log.Printf("❌ Login query error: %v", err)
			respondError(w, http.StatusInternalServerError, "Login error")
		}
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	log.Println("✅ User logged in:", userID)
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "ok",
		"user_id":   userID,
		"email":     req.Email,
		"full_name": fullName,
		"phone":     phone,
		"role":      role,
	})
}

// --- Handlers: Logs ---
func getLogsHandler(w http.ResponseWriter, r *http.Request) {
	driverID := r.URL.Query().Get("driver_id")
	
	query := `SELECT id, driver_id, date, start_time, end_time, revenue, trips_count, had_accident, notes, 
	                 to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at 
	          FROM logs`
	args := []interface{}{}
	
	if driverID != "" {
		query += " WHERE driver_id = $1"
		args = append(args, driverID)
	}
	query += " ORDER BY date DESC"

	rows, err := db.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("❌ DB query error: %v", err)
		respondError(w, http.StatusInternalServerError, "DB error")
		return
	}
	defer rows.Close()

	var logs []Log
	for rows.Next() {
		var l Log
		var createdAt string
		rows.Scan(&l.ID, &l.DriverID, &l.Date, &l.StartTime, &l.EndTime, 
			&l.Revenue, &l.TripsCount, &l.HadAccident, &l.Notes, &createdAt)
		l.CreatedAt = createdAt
		logs = append(logs, l)
	}
	respondJSON(w, http.StatusOK, logs)
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
		respondError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	_, err := db.Exec(r.Context(), `
		INSERT INTO logs (driver_id, date, start_time, end_time, revenue, trips_count, had_accident, notes, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
	`, req.DriverID, req.Date, req.StartTime, req.EndTime, req.Revenue, req.TripsCount, req.HadAccident, req.Notes)

	if err != nil {
		log.Printf("❌ Insert log error: %v", err)
		respondError(w, http.StatusInternalServerError, "Insert error")
		return
	}
	respondJSON(w, http.StatusCreated, map[string]string{"status": "created"})
}

// --- Health check ---
func pingHandler(w http.ResponseWriter, r *http.Request) {
	if err := db.Ping(r.Context()); err != nil {
		log.Printf("❌ DB ping error: %v", err)
		respondError(w, http.StatusInternalServerError, "DB not available")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// --- Main ---
func main() {
	ctx := context.Background()
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		connStr = "postgres://postgres:1488@localhost:5432/taxopark?sslmode=disable"
	}

	var err error
	db, err = pgxpool.New(ctx, connStr)
	if err != nil {
		log.Fatal("❌ DB connection failed:", err)
	}
	defer db.Close()

	if err := db.Ping(ctx); err != nil {
		log.Fatal("❌ DB ping failed:", err)
	}
	log.Println("✅ Connected to PostgreSQL")

	mux := http.NewServeMux()
	
	// === ROUTES: Cars ===
	mux.HandleFunc("GET /api/cars", getCarsHandler)
	mux.HandleFunc("POST /api/cars", addCarHandler)
	mux.HandleFunc("POST /api/cars/assign", assignCarHandler)
	mux.HandleFunc("POST /api/cars/unassign", unassignCarHandler)
	mux.HandleFunc("POST /api/cars/status", updateCarStatusHandler)
	
	// === ROUTES: Drivers / Auth ===
	mux.HandleFunc("GET /api/drivers", getDriversHandler)
	mux.HandleFunc("POST /api/auth/register", registerHandler)
	mux.HandleFunc("POST /api/auth/login", loginHandler)
	
	// === ROUTES: Logs ===
	mux.HandleFunc("GET /api/logs", getLogsHandler)
	mux.HandleFunc("POST /api/logs", addLogHandler)
	
	// === ROUTES: Health ===
	mux.HandleFunc("GET /api/ping", pingHandler)

	handler := corsMiddleware(mux)
	
	log.Println("🚀 Go API running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}