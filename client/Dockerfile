FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
# Install dependencies (using npm ci for cleaner install if lockfile exists, otherwise install)
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
