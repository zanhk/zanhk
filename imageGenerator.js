const { Configuration, OpenAIApi } = require("openai");
const http = require("https"); // or 'https' for https:// URLs
const fs = require("fs");

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
async function generateImageAndSave(prompt, username) {
	var promptNormalized = prompt.replace(/[^a-zA-Z0-9]/g, "_");
	var dateString = formatDate(new Date());

	var imageName = `${dateString}_${username}_${promptNormalized}`.toLowerCase();

	const response = await openai.createImage({
		prompt: prompt,
		n: 1,
		size: "1024x1024"
	});

	const file = fs.createWriteStream(`images/${imageName}.png`);

	const request = await http.get(response.data.data[0].url, function (response) {
		response.pipe(file);
		file.on("finish", () => {
			file.close();
		});
	});

	return {
		prompt: prompt,
		username: username,
		file: file,
		request: request
	};
}

module.exports = {
	generateImageAndSave: generateImageAndSave
};
