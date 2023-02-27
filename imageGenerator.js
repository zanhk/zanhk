const { Configuration, OpenAIApi } = require("openai");
const http = require("https"); // or 'https' for https:// URLs
const fs = require("fs");
var Filter = require("bad-words");

var customFilter = new Filter({ placeHolder: "x" });

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

/**
 * Format a date to YYYY_MM_DD
 * @param {Date} date
 * @returns
 */
function formatDate(date) {
	var d = new Date(date),
		month = "" + (d.getMonth() + 1),
		day = "" + d.getDate(),
		year = d.getFullYear();

	if (month.length < 2) month = "0" + month;
	if (day.length < 2) day = "0" + day;

	return [year, month, day].join("_");
}

/**
 * Generate an image and save it to the images folder
 * @param {string} prompt
 * @param {string} username
 * @returns
 */
async function generateImageAndSave(prompt, username, size) {
	var promptNormalized = prompt.replace(/[^a-zA-Z0-9]/g, "_");
	var dateString = formatDate(new Date());

	var imageName = `${dateString}_${username}_${promptNormalized}`.toLowerCase();

	var cleanedPromt = customFilter.clean(prompt);

	const response = await openai.createImage({
		prompt: cleanedPromt,
		n: 1,
		size: size
	});

	const file = fs.createWriteStream(`images/${imageName}.png`);

	const request = await http.get(response.data.data[0].url, function (response) {
		response.pipe(file);
		file.on("finish", () => {
			file.close();
		});
	});

	return {
		prompt: cleanedPromt,
		username: username,
		file: file,
		request: request
	};
}

module.exports = {
	generateImageAndSave: generateImageAndSave
};
