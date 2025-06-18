FROM node:24.0.2

WORKDIR /frontend

COPY package.json package-lock.json ./

# Install fresh
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
