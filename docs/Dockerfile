

FROM node:17-alpine 

# WORKDIR /workspace 
# Create and change to the app directory.
WORKDIR /docs

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY . .
RUN yarn install

ENV PORT=8080
ENV NODE_ENV=production

RUN yarn run build

ENTRYPOINT [ "yarn" ]

CMD [ "run", "start", "--port", "8080" ]
