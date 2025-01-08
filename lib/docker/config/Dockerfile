FROM node:lts-alpine

RUN mkdir /application

WORKDIR /application

COPY package.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm","start"]
