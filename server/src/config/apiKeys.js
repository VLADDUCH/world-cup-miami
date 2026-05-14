import "./env.js";

const keyValue = (name) => {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
};

const hasKey = (name) => keyValue(name).length > 0;

const apiKeys = {
  gnews: keyValue("GNEWS_API_KEY"),
  newsApi: keyValue("NEWSAPI_KEY"),

  ticketmaster: keyValue("TICKETMASTER_API_KEY"),
  eventbrite: keyValue("EVENTBRITE_TOKEN"),

  sportmonks: keyValue("SPORTMONKS_API_KEY"),
  apiFootball: keyValue("APIFOOTBALL_API_KEY"),

  geoapify: keyValue("GEOAPIFY_API_KEY"),

  status: {
    gnews: hasKey("GNEWS_API_KEY"),
    newsApi: hasKey("NEWSAPI_KEY"),

    ticketmaster: hasKey("TICKETMASTER_API_KEY"),
    eventbrite: hasKey("EVENTBRITE_TOKEN"),

    sportmonks: hasKey("SPORTMONKS_API_KEY"),
    apiFootball: hasKey("APIFOOTBALL_API_KEY"),

    geoapify: hasKey("GEOAPIFY_API_KEY"),
  },
};

export default apiKeys;
