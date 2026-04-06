FROM quay.io/mrxdking/star-xd:latest

RUN git clone https://github.com/XdKing2/star-xd /root/star-xd && \
    rm -rf /root/star-xd/.git

WORKDIR /root/star-xd

RUN npm install

EXPOSE 5000
CMD ["npm", "start"]


