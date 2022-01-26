import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";

const main = async () => {
  const orm = await MikroORM.init(mikroConfig); // connect to DB
  await orm.getMigrator().up(); // run migrations

  // this simply creates an instance of a Post, but doesn't add to DB
  //   const post = orm.em.create(Post, { title: "my first post" });
  //   await orm.em.persistAndFlush(post); // run SQL

  //   const posts = await orm.em.find(Post, {});
  //   console.log(posts);
};
main().catch((err) => {
  console.error(err);
});
