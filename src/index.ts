import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";

import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";

// let RedisStore = require("connect-redis")(session);

import { MyContext } from "./types";
import cors from "cors";

const main = async () => {
  // DB Setup
  const orm = await MikroORM.init(mikroConfig); // connect to DB
  await orm.getMigrator().up(); // run migrations
  // Server Setup
  const app = express();
  app.set("trust proxy", !__prod__);
  app.use(
    cors({
      credentials: true,
      origin: ["http://localhost:4000", "https://studio.apollographql.com"],
    })
  );

  // Redis Setup
  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "none", // protects csrf
        secure: true, // cookie only works in https
      },
      saveUninitialized: false,
      secret: "keyboardcatkeyboardcatkeyboardcat",
      resave: false,
    })
  );

  // Apollo Server Setup
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
  });

  // Start-up Servers
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};
main().catch((err) => {
  console.error(err);
});
