# Используем официальный образ Go
FROM golang:1.21-alpine AS builder

# Устанавливаем рабочие директории
WORKDIR /app

# Копируем go.mod и go.sum
COPY go.mod go.sum ./
RUN go mod download

# Копируем исходный код
COPY . .

# Собираем приложение
RUN go build -o main .

# Финальный образ (меньше размер)
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
COPY --from=builder /app/.env ./.env

# Открываем порт
EXPOSE 8080

# Запускаем
CMD ["./main"]