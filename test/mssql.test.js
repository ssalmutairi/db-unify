const { test } = require("tap");
const DbUnify = require("../index");

// mssql test
const options = {
	host: "localhost",
	port: 14330, // Update this as per your setup
	dialect: "mssql", // Change this to test other dialects
	username: "sa",
	password: "Password12!",
	logging: false,
};

const dbUnify = new DbUnify(options);

test("listUsers", async (t) => {
	const users = await dbUnify.listUsers();

	t.ok(users.length > 0, "should return list of users");
	// Add more assertions as necessary
});

test("listDatabases", async (t) => {
	const databases = await dbUnify.listDatabases();
	t.ok(databases.length > 0, "should return list of databases");
	// Add more assertions as necessary
});

test("listTables", async (t) => {
	const tables = await dbUnify.listTables("master"); // Update database name
	t.ok(tables.length > 0, "should return list of tables");
	// Add more assertions as necessary
});

test("listColumns", async (t) => {
	const columns = await dbUnify.listColumns("test", "demo"); // Update accordingly
	t.ok(columns.length > 0, "should return list of columns");
	// Add more assertions as necessary
});

test("createUser", async (t) => {
	await dbUnify.createUser("newUser", "newPass1234!"); // You might want to handle cleanup after test
	// Here, you can further query the database to check if the user was really created
	t.pass("User created successfully");
});

test("listPrivileges", async (t) => {
	const privileges = await dbUnify.listPrivileges();
	t.ok(privileges.length > 0, "should return list of privileges");
	// Add more assertions as necessary
});

test("listUserPrivileges", async (t) => {
	const userPrivileges = await dbUnify.listUserPrivileges("test"); // Update the username
	t.ok(userPrivileges.length > 0, "should return list of user privileges");
	// Add more assertions as necessary
});

test("grantPrivileges", async (t) => {
	await dbUnify.grantPrivileges("test", "demo", "SELECT,INSERT"); // Update accordingly
	// Here, you can further query the database to check if the privileges were really granted
	t.pass("Privileges granted successfully");
});

test("revokePrivileges", async (t) => {
	await dbUnify.revokePrivileges("test", "demo", "SELECT,INSERT"); // Update accordingly
	// Here, you can further query the database to check if the privileges were really revoked
	t.pass("Privileges revoked successfully");
});

test("grantPrivileges specific table", async (t) => {
	await dbUnify.grantPrivileges("newUser", "test", "SELECT,INSERT", "demo"); // Update accordingly
	// Here, you can further query the database to check if the privileges were really granted
	t.pass("Privileges granted successfully");
});

test("revokePrivileges specific table", async (t) => {
	await dbUnify.revokePrivileges("newUser", "test", "SELECT,INSERT", "demo"); // Update accordingly
	// Here, you can further query the database to check if the privileges were really revoked
	t.pass("Privileges revoked successfully");
});

test("cleanup and close", async (t) => {
	// You can add cleanup logic here, like removing the test user created etc.
	await dbUnify.close();
	t.pass("Cleaned up and closed successfully");
});
