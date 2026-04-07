FROM quay.io/mrxdking/star-xd:latest

RUN git clone https://github.com/unitedtraplol-glitch/Top-Frontier-MD-2.0 /root/star-xd && \
    rm -rf /root/star-xd/.git

WORKDIR /root/star-xd

RUN npm install

EXPOSE 5000
CMD ["npm", "start"]
