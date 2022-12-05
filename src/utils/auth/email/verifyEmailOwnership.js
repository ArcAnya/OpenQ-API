const verifyEmailOwnership = (req, email, magic) => {
	return new Promise(async (resolve, reject) => {
		try {
			const emailAuthRegex = /email_auth=\w+/;
			const regexMatch = req.headers.cookie.match(emailAuthRegex);

			let didToken;
			if (regexMatch === null) {
				return reject('No email_auth cookie found');
			} else {
				didToken = req.headers.cookie.match(regexMatch)[0].slice(28);
			}

			const isTokenValid = await magic.auth.verifyToken(didToken);
			return resolve(isTokenValid);
		} catch (error) {
			return reject(error);
		}
	});
};

module.exports = verifyEmailOwnership;