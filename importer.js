const inquirer = require('inquirer')
const mongodb = require('mongodb').MongoClient
const csv = require('csv-parser')
const fs = require('fs')

const validateInput = input => {
	const pass = input.match(/^[a-zA-Z0-9_]+$/)
	if (pass) {
		return true
	}

	return 'Not a valid name. Omit spaces and special characters except "_"'
}

const questions = [
	{
		name: 'database',
		message: 'Name your database:',
		type: 'input',
		validate: validateInput,
	},
	{
		name: 'collection',
		message: 'Name your collection:',
		type: 'input',
		validate: validateInput,
	},
	{
		name: 'csvPath',
		message: 'Type the path to your csv file that you want to import:',
		type: 'input',
	},
	{
		name: 'localhost',
		message: 'Import to local mongodb?',
		type: 'confirm',
	},
	{
		name: 'dbUrl',
		message: 'Type your database connection string:',
		type: 'input',
		when: answers => !answers.localhost,
	},
]

inquirer.prompt(questions).then(answers => {
	const dbName = answers.database
	const collName = answers.collection
	const csvPath = answers.csvPath
	const dbUrl = answers.dbUrl || 'mongodb://localhost:27017'

	const csvData = []

	// Read and format csv headers then import to MongoDB
	fs.createReadStream(csvPath)
		.pipe(
			csv({
				// Format csv headers
				mapHeaders: ({ header, index }) =>
					header.trim().replace(' ', '_').toLowerCase(),
			})
		)
		.on('data', data => csvData.push(data))
		.on('end', () => {
			mongodb.connect(
				dbUrl,
				{ useNewUrlParser: true, useUnifiedTopology: true },
				(err, client) => {
					if (err) throw err

					client
						.db(dbName)
						.collection(collName)
						.insertMany(csvData, (err, res) => {
							if (err) throw err

							console.log(`Inserted: ${res.insertedCount} rows`)
							client.close()
						})
				}
			)
		})
})
