import {Enum} from "./utils/Enum";

class NetworkEvent extends Enum {
    static DOWNLOADS = new NetworkEvent("downloads");
    static STATS = new NetworkEvent("stats");
    static NOTIFICATIONS = new NetworkEvent("notifications");
}

export {NetworkEvent}