FROM node:12
WORKDIR /usr/src/app
COPY . /usr/src/app/
RUN npm install && cd client && npm install @angular/cli && npm install && npm run build

EXPOSE 3080

CMD ["node", "server.js"]