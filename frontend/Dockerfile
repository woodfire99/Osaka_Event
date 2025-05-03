FROM node:18

WORKDIR /app

COPY package*.json ./

# react-scripts 누락 방지용 한 줄 추가
RUN npm install && npm install react-scripts

COPY . .

CMD ["npm", "start"]
