const { Configuration, OpenAIApi } = require("openai");
const http = require("https"); // or 'https' for https:// URLs
const fs = require("fs");
const Jimp = require("jimp");

var Filter = require("bad-words");

var customFilter = new Filter({ placeHolder: "x" });

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

/**
 * You guessed! it writes text to an image
 * @param {*} file
 * @param {string} text
 */
async function writeTextToImage(file, text) {
	const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

	const image = await Jimp.read(file.path);

	// Get the width and height of the image and the text
	const imageWidth = image.bitmap.width;
	const imageHeight = image.bitmap.height;
	const textWidth = Jimp.measureText(font, text);

	// Calculate the x and y positions for the text
	const xPos = imageWidth - textWidth - 20; // 20 pixels from the right edge
	const yPos = imageHeight - 20; // 20 pixels from the bottom edge

	// Print the text onto the image at the calculated position
	image.print(font, xPos, yPos, text);

	const mask = await Jimp.read("./mask.png");

	image.mask(mask, 0, 0);

	return image.write(file.path);
}

/**
 * Generate an image and save it to the images folder
 * @param {string} prompt
 * @param {string} username
 * @returns
 */
async function generateImageAndSave(prompt, issueId, username, size) {
	var imageName = issueId;

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
			writeTextToImage(file, "zank.it");
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
