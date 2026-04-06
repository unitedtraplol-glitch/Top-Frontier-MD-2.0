FROM quay.io/unitedtraplol-glitch/Top-Frontier-MD-2.0:latest

RUN git clone https://github.com/unitedtraplol-glitch/Top-Frontier-MD-2.0 /root/Top-Frontier-MD-2.0 && \
    rm -rf /root/Top-Frontier-MD-2.0/.git

WORKDIR /root/Top-Frontier-MD-2.0

RUN npm install

EXPOSE 5000
CMD ["npm", "start"]


