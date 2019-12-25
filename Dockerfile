FROM node:12.14.0-alpine

WORKDIR /kubeweekly
COPY . .
RUN npm install