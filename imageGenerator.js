const { Configuration, OpenAIApi } = require("openai");
const http = require("https"); // or 'https' for https:// URLs
const fs = require("fs");
const Jimp = require("jimp");

var Filter = require("bad-words");

var customFilter = new Filter({ placeHolder: "x" });

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
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
	const yPos = imageHeight - 30; // 20 pixels from the bottom edge

	// Print the text onto the image at the calculated position
	image.print(font, xPos, yPos, text);

	const mask = await Jimp.read("./mask.png");

	image.mask(mask, 0, 0);

	return image.write(file.path);
}

async function openAiGenerateImage(prompt, size, imageName) {
	console.debug("Generating image using Stable DALL-E");

	const response = await openai.createImage({
		prompt: prompt,
		n: 1,
		size: size + "x" + size,
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
		file: file,
		request: request,
	};
}

async function stableDiffusionGenerateImage(prompt, size, imageName) {
	console.debug("Generating image using Stable Diffusion");

	const path = "https://api.stability.ai/v1/generation/stable-diffusion-xl-beta-v2-2-2/text-to-image";

	const headers = {
		Accept: "application/json",
		Authorization: process.env.STABLE_DIFFUSION_API_KEY,
	};

	const body = {
		width: size,
		height: size,
		steps: 50,
		seed: 0,
		cfg_scale: 7,
		samples: 1,
		style_preset: "enhance",
		text_prompts: [
			{
				text: prompt,
				weight: 1,
			},
		],
	};

	const options = {
		hostname: "api.stability.ai",
		path: path,
		method: "POST",
		headers: headers,
	};

	const res = new Promise((resolve, reject) => {
		http.request(options, (res) => {
			let data = "";

			res.on("data", (chunk) => {
				data += chunk;
			});

			res.on("end", () => {
				const responseJSON = JSON.parse(data);

				// get the image from response
				const image = responseJSON.artifacts[0];

				// save the image
				const imagePath = `images/${imageName}.png`;
				fs.writeFileSync(imagePath, Buffer.from(image.base64, "base64"));

				resolve({
					file: {
						path: imagePath,
					},
					prompt: prompt,
					username: username,
				});
			});
		})
			.on("error", (error) => {
				console.error(error);
				reject(error);
			})
			.end(JSON.stringify(body));
	});

	return res;
}

/**
 * Generate an image and save it to the images folder
 * @param {string} prompt
 * @param {string} username
 * @returns
 */
async function generateImageAndSave(model, prompt, issueId, username, size) {
	var imageName = issueId;

	var cleanedPromt = customFilter.clean(prompt);

	let result = null;

	switch (model) {
		case "DALL-E":
			result = await openAiGenerateImage(cleanedPromt, size, imageName);
			break;
		case "Stable diffusion":
			result = await stableDiffusionGenerateImage(cleanedPromt, size, imageName);
			break;
		default:
			result = await openAiGenerateImage(cleanedPromt, size, imageName);
			model = "DALL-E";
			break;
	}

	return {
		prompt: cleanedPromt,
		username: username,
		file: result?.file,
		request: result?.request,
		model: model,
	};
}

module.exports = {
	generateImageAndSave: generateImageAndSave,
};
