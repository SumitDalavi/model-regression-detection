FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tsc
EXPOSE 5001
CMD ["node", "dist/src/index.js"]
