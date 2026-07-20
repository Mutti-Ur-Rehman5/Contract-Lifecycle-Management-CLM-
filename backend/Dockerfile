FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
