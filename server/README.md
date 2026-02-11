# TribalMingle Push Service

This service handles device token registration and sends push notifications for likes, matches, and messages.

## Environment

Copy `.env.example` to `.env` and fill in required values.

## Endpoints

- `POST /notifications/device-token`
- `DELETE /notifications/device-token?deviceToken=...`
- `POST /events/like`
- `POST /events/match`
- `POST /events/message`
- `GET /health`
