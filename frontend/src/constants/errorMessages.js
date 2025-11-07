export const ErrorKeys = {
  LOAD_ITEM_FAILED: "LOAD_ITEM_FAILED",
  LOAD_ITEMS_FAILED: "LOAD_ITEMS_FAILED",
  UPDATE_ITEM_FAILED: "UPDATE_ITEM_FAILED",
  CREATE_ITEM_FAILED: "CREATE_ITEM_FAILED",
  DELETE_ITEM_FAILED: "DELETE_ITEM_FAILED",
  LOAD_EVENTS_FAILED: "LOAD_EVENTS_FAILED",
  LOAD_EVENT_FAILED: "LOAD_EVENT_FAILED",
  CREATE_EVENT_FAILED: "CREATE_EVENT_FAILED",
  UPDATE_EVENT_FAILED: "UPDATE_EVENT_FAILED",
  DELETE_EVENT_FAILED: "DELETE_EVENT_FAILED",
  GENERIC_ERROR: "GENERIC_ERROR",
};

export const ERROR_CONFIG = {
  [ErrorKeys.LOAD_ITEM_FAILED]: {
    message: "Failed to load item details. Please try again later.",
    onBack: (navigate) => () => navigate("/items"),
    backLabel: "← Back to Items",
  },
  [ErrorKeys.LOAD_ITEMS_FAILED]: {
    message: "Failed to load items. Please try again later.",
    onBack: (navigate) => () => navigate("/home"),
    backLabel: "← Back to Home",
  },
  [ErrorKeys.UPDATE_ITEM_FAILED]: {
    message: "Failed to update item. Please check your input and try again.",
    onBack: (navigate, id) => () => navigate(`/items/${id}`),
    backLabel: "← Back to Item Details",
  },
  [ErrorKeys.CREATE_ITEM_FAILED]: {
    message: "Failed to create item. Please try again later.",
    onBack: (navigate) => () => navigate("/items"),
    backLabel: "← Back to Items",
  },
  [ErrorKeys.DELETE_ITEM_FAILED]: {
    message: "Failed to delete item. Please try again later.",
    onBack: (navigate, id) => () => navigate(`/items`),
    backLabel: "← Back to Items",
  },
  [ErrorKeys.LOAD_EVENTS_FAILED]: {
    message: "Failed to load events. Please try again later.",
    onBack: (navigate) => () => navigate("/home"),
    backLabel: "← Back to Home",
  },
  [ErrorKeys.LOAD_EVENT_FAILED]: {
    message: "Failed to load event details. Please try again later.",
    onBack: (navigate) => () => navigate("/events"),
    backLabel: "← Back to Events",
  },
  [ErrorKeys.CREATE_EVENT_FAILED]: {
    message: "Failed to create event. Please try again later.",
    onBack: (navigate) => () => navigate("/events"),
    backLabel: "← Back to Events",
  },
  [ErrorKeys.UPDATE_EVENT_FAILED]: {
    message: "Failed to update event. Please check your input and try again.",
    onBack: (navigate, id) => () => navigate(`/events/${id}`),
    backLabel: "← Back to Event Details",
  },
  [ErrorKeys.DELETE_EVENT_FAILED]: {
    message: "Failed to delete event. Please try again later.",
    onBack: (navigate) => () => navigate("/events"),
    backLabel: "← Back to Events",
  },
  [ErrorKeys.GENERIC_ERROR]: {
    message: "Something went wrong. Please try again.",
    onBack: (navigate) => () => navigate("/items"),
    backLabel: "← Back to Items",
  },
};
