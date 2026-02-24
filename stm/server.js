const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(express.json());
app.use(cors());

const role = require("./routes/rolesroute");
const users = require("./routes/usersroute");
const tickets = require("./routes/ticketsroute");
const ticket_comments = require("./routes/ticket_commentsroute");

app.use("/api/role", role);
app.use("/api/users", users);
app.use("/api/tickets", tickets);
app.use("/api/comments", ticket_comments);

app.listen(process.env.PORT, () => {
    console.log(`server running on ${process.env.PORT}`);
});