FROM node:12.14.0-alpine

RUN mkdir /kubeweekly
WORKDIR /kubeweekly
COPY . .
RUN npm install
