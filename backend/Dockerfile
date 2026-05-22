# Файл: D:/SPOkursach/project/backend/Dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app

# 1. Копируем только go.mod (без go.sum)
COPY go.mod ./

# 2. Скачиваем зависимости и создаём go.sum ВНУТРИ контейнера
RUN go mod download
RUN go mod verify

# 3. Копируем исходный код
COPY . .

# 4. Запускаем go mod tidy ВНУТРИ контейнера (он создаст правильный go.sum)
RUN go mod tidy

# 5. Собираем приложение
RUN go build -o main .

# Финальный образ
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]