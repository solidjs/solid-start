

FROM cl00e9ment/node.js-builder

# WORKDIR /workspace 
# Create and change to the app directory.
WORKDIR /repo

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY . .

RUN pnpm install

ENV PORT=3000

WORKDIR /repo/docs

ENV NODE_ENV=production

RUN pnpm run build

ENTRYPOINT [ "pnpm" ]

CMD [ "run", "start" ]
