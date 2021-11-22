// file deepcode ignore DisablePoweredBy
// file deepcode ignore UseCsurfForExpress
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as express from "express";
import * as helmet from "helmet";
import * as rateLimit from "express-rate-limit";
import * as path from "path";
import * as hpp from "hpp";
import "reflect-metadata";
import { createConnection } from "typeorm";
import * as fs from "fs";
import { getConfig } from "container-env";
import { User } from "./entity/User";
import { createAdminUser1574018391679 } from "./migration/1574018391679-createAdminUser";
import routes from "./routes";
import ConfigController from "./controllers/ConfigController";
import { TaskSolution } from "./entity/TaskSolution";

const config = getConfig(JSON.parse(fs.readFileSync(path.join(__dirname, "../../container-env.json")).toString()), "/app/config/adventskalender.json");

// Connects to the Database -> then starts the express
createConnection({
    charset: "utf8mb4",
    cli: {
        entitiesDir: "src/entity",
        migrationsDir: "src/migration",
        subscribersDir: "src/subscriber",
    },
    database: config.DB_NAME,
    // List all entities here
    entities: [
        User,
        TaskSolution,
    ],
    host: config.DB_HOST,
    logging: false,
    // List all migrations here
    migrations: [createAdminUser1574018391679],
    migrationsRun: true,
    password: config.DB_PASSWORD,
    port: config.DB_PORT,
    synchronize: true,
    type: "mysql",
    username: config.DB_USER,
})
    .then(async (connection) => {
        await connection.query("SET NAMES utf8mb4;");
        await connection.synchronize();
        // eslint-disable-next-line no-console
        console.log("Migrations: ", await connection.runMigrations());
        const app = express();

        app.locals.config = config;

        app.use(cors());
        app.use(helmet({
            frameguard: false,
        }));
        app.use(bodyParser.urlencoded({
            extended: true,
        }));
        app.use(bodyParser.json());
        app.use(hpp());

        app.use(rateLimit({
            max: 1200,
            windowMs: 1000 * 10 * 60,
        }));

        app.use("/api", routes);
        app.use("/config.json", ConfigController.config);
        app.use("/", express.static("/app/dist/frontend"));
        app.use("*", express.static("/app/dist/frontend/index.html"));

        let port = 80;
        if (process.env.NODE_ENV == "development") {
            port = 3000;
        }
        app.listen(port, () => {
            // eslint-disable-next-line no-console
            console.log(`Server started on port ${port}!`);
        });
    })
    // eslint-disable-next-line no-console
    .catch((error) => console.log(error));
