export async function AIReply(userMessage) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        text: "So your destination will be KLCC ? ",
        ticket_details: {
          session_id: "12345",
          ticket_id: "67890",
          from_station: "KL Sentral",
          to_station: "Bukit Bintang",
          fare: "3.50",
          interchange: "Pasar Seni",
          datetime: new Date().toISOString(),
        },
        route_details: {
          station_line1: ["KL Sentral", "Pasar Seni"],
          station_line2: ["Pasar Seni", "Bukit Bintang"],
          interchange_station: ["Pasar Seni"],
        },
        query_type: "route_query",
      });
    }, 1500);
  });
}