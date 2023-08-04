export default {
  "title": "Collections",
  "version": 0,
  "description": "describes a simple hero",
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 21
    },
    "type": {
      "type": "string",
      "maxLength": 3
    },
    "name": {
      "type": "string",
      "maxLength": 32
    },
    "visits": {
      "type": "number",
      "minimum": 0,
      "maximum": 9999,
      default: 0
    },
    "lastVisit": {
      "type": "number",
      "minimum": 1.68e12,
      "maximum": 2e12,
      default: Date.now()
    },
    "cr": {
      "type": "number",
      "final": true,
      "minimum": 1.68e12,
      "maximum": 2e12,
      default: Date.now()
    },
  },
  "required": [
    "id",
    "type",
    "name"
  ]
};
