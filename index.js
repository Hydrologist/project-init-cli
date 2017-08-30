#!/usr/bin/env node --harmony

// Required modules
// ===========================
const co = require('co');
const prompt = require('co-prompt');
const program = require('commander');
const chalk = require('chalk');
const execSync = require('child_process').execSync;
const fs = require('fs-extra');
const superagent = require('superagent');

// Chalk colors
// ===========================
const color = {
	title: {
		r: 26,
		g: 188,
		b: 156
	},
	question: {
		r: 155,
		g: 89,
		b: 182
	},
	process: {
		r: 241,
		g: 196,
		b: 15
	},
	complete: {
		r: 46,
		g: 204,
		b: 113
	}
};

// Configuration
// ===========================
const config = {};
const repos = {
	venueVisualforce: '/kineticgrowth/venue-quickstart.git',
	venueLightning: '/kineticgrowth/venue-quickstart.git',
	encore: '/kineticgrowth/encore-quickstart.git'
};

// Run our program accepting the customer argument
program
	.arguments('<customer>')
	.action(function (customer) {
		co(function* () {
			console.log(chalk.rgb(color.title.r, color.title.g, color.title.b).bold('\n\nLooks like you are setting up a new Kinetic Growth project for ' + customer + '!\n\nLet\'s walk through some basic questions to help you get started.'));

			// Convert customer name to project name
			config.name = customer.replace(' ', '-').replace('.', '').toLowerCase() + '-implementation';
			config.dir = process.cwd() + '/' + config.name;

			// Collect product name
			const product = yield prompt(chalk.rgb(color.question.r, color.question.g, color.question.b)('\nWhich product are you setting up? (1/2/3)\n 1) Venue Lightning\n 2) Venue Visualforce (E-Commerce Order)\n 3) Encore\nProduct: '));

			let productName,
					repoUrl;
			if(product === '1') {
				productName = 'Venue Lightning';
				repoUrl = repos.venueLightning;
			} else if(product === '2') {
				productName = 'Venue Visualforce';
				repoUrl = repos.venueVisualforce;
			} else if(product === '3') {
				productName = 'Encore';
				repoUrl = repos.encore;
			}

			// Confirm directory setup
			if(yield prompt.confirm(chalk.rgb(color.question.r, color.question.g, color.question.b)(`\nWe are going to set up ${productName} in ${config.dir}. Is this okay? (Yes/No) `))) {

				// Create directory
				console.log(chalk.rgb(color.process.r, color.process.g, color.process.b)(`Creating ${config.dir}...`));
				fs.emptyDirSync(config.dir);
				process.chdir(config.dir);
				console.log(chalk.rgb(color.complete.r, color.complete.g, color.complete.b)('Directory created.'));

				// Download quickstart
				const bitbucketUsername = yield prompt(chalk.rgb(color.question.r, color.question.g, color.question.b)('\nWhat is your Bitbucket username? '));
				const fullRepoUrl = `https://${bitbucketUsername}@bitbucket.org${repoUrl}`;
				console.log(chalk.rgb(color.process.r, color.process.g, color.process.b)(`Cloning quick-start repository ${repoUrl} as ${bitbucketUsername}...`));
				execSync(`git clone ${fullRepoUrl} .`);
				fs.removeSync('./.git');
				fs.emptyDirSync('./docs');
				console.log(chalk.rgb(color.complete.r, color.complete.g, color.complete.b)('Clone completed.'));

				// Link to Bitbucket
				yield prompt(chalk.rgb(color.question.r, color.question.g, color.question.b)(`\nIf you have not already created the Bitbucket repository "/kineticgrowth/${config.name}" do this now. Press <enter> when this is done.`));
				execSync('git init');
				execSync(`git remote add origin https://${bitbucketUsername}@bitbucket.org/kineticgrowth/${config.name}`);

				// Switch to sandbox branch
				const sandboxName = yield prompt(chalk.rgb(color.question.r, color.question.g, color.question.b)('\nWhat is the name of the sandbox you are working in? (dev, july2017, etc.) '));
				execSync(`git checkout -b sandbox/${sandboxName}`);
				execSync('git add .');
				execSync('git commit -m "Initial Setup"');
				console.log(chalk.rgb(color.process.r, color.process.g, color.process.b)('Pushing to Bitbucket...'));
				// Comment back in to push to origin
				execSync(`git push origin sandbox/${sandboxName}`);
				console.log(chalk.rgb(color.complete.r, color.complete.g, color.complete.b)('Bitbucket is updated.'));

				// Provide IDE instructions
				const ide = yield prompt(chalk.rgb(color.question.r, color.question.g, color.question.b)('\nWhich IDE are you using? (1/2/3/4) \n 1) Mavensmate\n 2) Force.com IDE\n 3) Developer Console\n 4) Other \n IDE: '));
				if(ide.toLowerCase() === '1') {
					console.log(chalk.rgb(color.title.r, color.title.g, color.title.b)('Please open your project in Sublime Text, right click on your project root folder and select "Mavensmate" > "Create Mavensmate Project" to convert the directory to a Mavensmate project. \nExisting Directory conversion is not currently supported in Atom.'));
				} else if(ide.toLowerCase() === '2') {
					console.log(chalk.rgb(color.title.r, color.title.g, color.title.b)('No additional setup is needed to use this project in the Force.com IDE.'));
				} else if(ide.toLowerCase() === '3') {
					console.log(chalk.red('Using the Developer Console is highly discouraged as this tool provides no way to download code and commit changes to git.'));
				} else {
					console.log(chalk.rgb(color.title.r, color.title.g, color.title.b)('Please follow the directions for your specific IDE to connect this project to Salesforce.'));
				}

				// Provide editor instructions
				config.editor = yield prompt(chalk.rgb(color.question.r, color.question.g, color.question.b)('\nWhich editor are you using? (1/2/3)\n 1) Sublime\n 2) Atom\n 3) Other\nEditor: '));
				config.editor = config.editor.toLowerCase();

				if(config.editor === '1') {
					console.log(chalk.rgb(color.title.r, color.title.g, color.title.b)(`Sublime Text does not have a CLI so you will have to open the editor manually.`));
				} else if(config.editor === '2') {
					console.log(chalk.rgb(color.process.r, color.process.g, color.process.b)('Opening your project in Atom...'));
					execSync('atom .');
					console.log(chalk.rgb(color.complete.r, color.complete.g, color.complete.b)('Project opened in Atom'));
				}

				// Complete
				console.log(chalk.rgb(color.complete.r, color.complete.g, color.complete.b).bold(`\nSetup complete!`));
				console.log(chalk.rgb(color.complete.r, color.complete.g, color.complete.b)(`Please remember to keep commiting your work as you go and update the /master branch when you go to production.\n`));

				process.exit(0);
			} else {
				// Bailed out so show an exit message
				console.log(chalk.red('Exiting - no changes were made.'));
				process.exit(0);
			}
		});
	}).parse(process.argv);