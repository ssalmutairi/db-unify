const Sequelize = require("sequelize");

class DbUnify extends Sequelize {
	constructor(options) {
		super(options);
	}

	// list users based on dialect
	async listUsers() {
		let result = [];
		switch (this.getDialect()) {
			case "mysql": {
				result = await this.query("SELECT user FROM mysql.user", { type: this.QueryTypes.SELECT });
				result = result.map((user) => user.user);
				const ignoreList = ["root", "mysql.session", "mysql.sys", "mysql.infoschema"];
				result = result.filter((user) => !ignoreList.includes(user));
				break;
			}
			case "postgres": {
				result = await this.query("SELECT rolname FROM pg_roles", { type: this.QueryTypes.SELECT });
				result = result.map((user) => user.rolname);
				const ignoreList = [
					"pg_monitor",
					"pg_read_all_settings",
					"pg_read_all_stats",
					"pg_stat_scan_tables",
					"pg_read_server_files",
					"pg_write_server_files",
					"pg_execute_server_program",
					"pg_signal_backend",
				];
				result = result.filter((user) => !ignoreList.includes(user));
				break;
			}
			case "mssql": {
				result = await this.query("SELECT name FROM sys.sql_logins", { type: this.QueryTypes.SELECT });
				result = result.map((user) => user.name);
				const ignoreList = ["sa", "##MS_PolicyEventProcessingLogin##", "##MS_PolicyTsqlExecutionLogin##"];
				result = result.filter((user) => !ignoreList.includes(user));
				break;
			}
			default:
				return [];
		}
		return result;
	}

	// generate methods to get listDatabases based on dialect
	async listDatabases() {
		switch (this.getDialect()) {
			case "mysql": {
				const result = await this.query("SHOW DATABASES", { type: this.QueryTypes.SELECT });
				return result.map((database) => database.Database);
			}
			case "postgres": {
				const result = await this.query("SELECT datname FROM pg_database WHERE datistemplate = false;", {
					type: this.QueryTypes.SELECT,
				});
				return result.map((database) => database.datname);
			}
			case "mssql": {
				const result = await this.query("SELECT name FROM master.sys.databases", {
					type: this.QueryTypes.SELECT,
				});
				return result.map((database) => database.name);
			}
			default:
				return [];
		}
	}

	// generate methods to get listTables of a database based on dialect
	async listTables(database) {
		switch (this.getDialect()) {
			case "mysql": {
				const result = await this.query(`SHOW TABLES FROM ${database}`, { type: this.QueryTypes.SELECT });
				return result.map((table) => table[`Tables_in_${database}`]);
			}
			case "postgres":
				const result = await this.query(
					`SELECT table_name FROM information_schema.tables WHERE table_schema = '${database}'`,
					{
						type: this.QueryTypes.SELECT,
					}
				);
				return result.map((table) => table.table_name);
			case "mssql": {
				const result = await this.query(
					`SELECT TABLE_NAME FROM ${database}.INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`,
					{ type: this.QueryTypes.SELECT }
				);
				return result.map((table) => table.TABLE_NAME);
			}
			default:
				return [];
		}
	}

	// generate methods to get listColumns of a table based on dialect
	async listColumns(database, table) {
		switch (this.getDialect()) {
			case "mysql": {
				const result = await this.query(`SHOW COLUMNS FROM ${database}.${table}`, {
					type: this.QueryTypes.SELECT,
				});
				return result.map((column) => column.Field);
			}

			case "postgres": {
				// Adjust 'public' to the desired schema if different.
				const result = await this.query(
					`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}'`,
					{
						type: this.QueryTypes.SELECT,
					}
				);
				return result.map((column) => column.column_name);
			}
			case "mssql": {
				const result = await this.query(
					`SELECT COLUMN_NAME FROM ${database}.INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}'`,
					{ type: this.QueryTypes.SELECT }
				);
				return result.map((column) => column.COLUMN_NAME);
			}
			default:
				return [];
		}
	}

	// generate a user if not exists based on dialect
	async createUser(user, password) {
		switch (this.getDialect()) {
			case "mysql": {
				const result = await this.query(`SELECT 1 FROM mysql.user WHERE user = '${user}'`, {
					type: this.QueryTypes.SELECT,
				});
				if (result.length === 0) {
					return await this.query(`CREATE USER '${user}'@'localhost' IDENTIFIED BY '${password}'`);
				}
				// if user exists, update password
				return await this.query(`ALTER USER '${user}'@'localhost' IDENTIFIED BY '${password}'`);
			}
			case "postgres": {
				const [result] = await this.query(`SELECT 1 FROM pg_roles WHERE rolname = :username AND rolcanlogin = true`, {
					replacements: { username: user },
					type: this.QueryTypes.SELECT,
				});

				if (!result || result.length === 0) {
					// If user doesn't exist, create the user
					return await this.query(`CREATE USER :username WITH PASSWORD :password`, {
						replacements: { username: user, password: password },
					});
				} else {
					// If user exists, update the password
					return await this.query(`ALTER USER :username WITH PASSWORD :password`, {
						replacements: { username: user, password: password },
					});
				}
			}
			case "mssql": {
				const result = await this.query(`SELECT 1 FROM sys.sql_logins WHERE name = '${user}'`, {
					type: this.QueryTypes.SELECT,
				});
				if (result.length === 0) {
					return await this.query(`CREATE LOGIN ${user} WITH PASSWORD = '${password}'`);
				}
				// if user exists, update password
				return await this.query(`ALTER LOGIN ${user} WITH PASSWORD = '${password}'`);
			}
			default:
				return [];
		}
	}

	// list available privileges based on dialect
	async listPrivileges() {
		switch (this.getDialect()) {
			case "mysql": {
				const result = await this.query(`SHOW PRIVILEGES`, { type: this.QueryTypes.SELECT });
				return result.map((privilege) => privilege.Privilege);
			}
			case "postgres": {
				const result = await this.query(`SELECT * FROM pg_roles`, { type: this.QueryTypes.SELECT });
				return result.map((privilege) => privilege.rolname);
			}
			case "mssql": {
				const result = await this.query(`SELECT * FROM sys.server_principals`, {
					type: this.QueryTypes.SELECT,
				});
				return result.map((privilege) => privilege.name);
			}
			default:
				return [];
		}
	}

	// list user privileges based on dialect
	async listUserPrivileges(user, host = "%") {
		switch (this.getDialect()) {
			case "mysql": {
				const result = await this.query(`SHOW GRANTS FOR '${user}'@'${host}'`, {
					type: this.QueryTypes.SELECT,
				});
				return result.map((privilege) => privilege.Grant);
			}
			case "postgres": {
				const result = await this.query(`SELECT * FROM pg_roles WHERE rolname = '${user}'`, {
					type: this.QueryTypes.SELECT,
				});
				return result.map((privilege) => privilege.rolname);
			}
			case "mssql": {
				const result = await this.query(`SELECT * FROM sys.server_principals WHERE name = '${user}'`, {
					type: this.QueryTypes.SELECT,
				});
				return result.map((privilege) => privilege.name);
			}
			default:
				return [];
		}
	}

	// grant specific privileges to a user based on dialect for a specific table or all tables
	async grantPrivileges(user, database, privileges, table = "*", host = "%") {
		// privileges is a string of comma separated privileges
		// table is a string of table name or * for all tables

		switch (this.getDialect()) {
			case "mysql": {
				return await this.query(`GRANT ${privileges} ON ${database}.${table} TO '${user}'@'${host}'`);
			}
			case "postgres": {
				const schema = "public"; // adjust if using a different schema
				if (table === "*") {
					return await this.query(`GRANT ${privileges} ON ALL TABLES IN SCHEMA ${schema} TO ${user}`);
				} else {
					return await this.query(`GRANT ${privileges} ON TABLE ${schema}.${table} TO ${user}`);
				}
			}
			case "mssql": {
				// First, check if the user doesn't exist
				const [userExists] = await this.query(
					`USE ${database}; SELECT 1 FROM sys.database_principals WHERE name = '${user}'`,
					{
						type: this.QueryTypes.SELECT,
					}
				);

				if (!userExists) {
					// Only create the user if they don't exist
					await this.query(`USE ${database}; CREATE USER ${user} FOR LOGIN ${user}`);
				}

				if (table === "*") {
					// Fetch all table names from the specified database
					const tables = await this.query(
						`USE ${database}; SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`,
						{ type: this.QueryTypes.SELECT }
					);

					// Now, iterate over each table and grant the privileges
					for (let t of tables) {
						await this.query(`USE ${database}; GRANT ${privileges} ON dbo.${t.TABLE_NAME} TO ${user}`);
					}

					return; // Return after granting permissions on all tables
				} else {
					// Assuming default schema is dbo, adjust as needed
					return await this.query(`USE ${database}; GRANT ${privileges} ON dbo.${table} TO ${user}`);
				}
			}
			default:
				return [];
		}
	}

	// revoke specific privileges from a user based on dialect for a specific table or all tables
	async revokePrivileges(user, database, privileges, table = "*", host = "%") {
		// privileges is a string of comma separated privileges
		// table is a string of table name or * for all tables

		switch (this.getDialect()) {
			case "mysql": {
				return await this.query(`REVOKE ${privileges} ON ${database}.${table} FROM '${user}'@'${host}'`);
			}
			case "postgres": {
				const schema = "public"; // adjust if using a different schema
				if (table === "*") {
					return await this.query(`REVOKE ${privileges} ON ALL TABLES IN SCHEMA ${schema} FROM ${user}`);
				} else {
					return await this.query(`REVOKE ${privileges} ON TABLE ${schema}.${table} FROM ${user}`);
				}
			}
			case "mssql": {
				if (table === "*") {
					// Fetch all table names from the specified database
					const tables = await this.query(
						`USE ${database}; SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`,
						{ type: this.QueryTypes.SELECT }
					);

					// Now, iterate over each table and revoke the privileges
					for (let t of tables) {
						await this.query(`USE ${database}; REVOKE ${privileges} ON dbo.${t.TABLE_NAME} FROM ${user}`);
					}

					return; // Return after revoking permissions on all tables
				} else {
					// Assuming default schema is dbo, adjust as needed
					return await this.query(`USE ${database}; REVOKE ${privileges} ON dbo.${table} FROM ${user}`);
				}
			}
			default:
				return [];
		}
	}
}

module.exports = DbUnify;
