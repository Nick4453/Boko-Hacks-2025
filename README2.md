# Names

- Saidi Adams
- Blake Jameson
- Alan De La Torres

# Tools & Resources

- [Duo Mobile Web SDK](https://duo.com/docs/duoweb)
- [CloudMersive Virus Scan API](https://api.cloudmersive.com/python-client.asp)
- [SonarQube Cloud SecurityScan](https://www.sonarsource.com/products/sonarcloud/)
- [StackHawk SQL Injecting Vulnerability Scan](https://www.stackhawk.com/)
- [ollama](https://ollama.com)

# Build & Run Instructions

### Setup APIs

Go to Duo, CloudMersive, and StackHawk, get API credentials for each service, and put them inside of the template.env(& rename it to .env). Any other values can be made whatever you want, but if it's a security key/password make sure that it's secure.

Side Note:
StackHawk is only used on the command line, it shows you vulnerabilities only, its not used in production but its cool to see the analysis.

### Install Beforehand

1. Install [ollama](https://ollama.com/) and follow instructions to install [deepseek-r1:14b](https://ollama.com/library/deepseek-r1) and [llama3.2](https://ollama.com/library/llama3.2).
2. Install python & Node.JS with npm

### Set up Project

```sh
git clone https://github.com/hrfarmer/Boko-Hacks-2025
cd Boko-Hacks-2025
pip install -r requirements.txt
cd frontend
npm i
npm run build
cd ..
python app.py
```

Then go to http://localhost:5000 in your browser

# Future Improvements

Some future improvements we could make are incorporating more AI features throughout the ui, such as summarizing notes or summarizing news articles. Some security features we could implement that feature AI are an AI powered intrusion detection system, where it can analyze login patterns and flag if an event looks out of place.
