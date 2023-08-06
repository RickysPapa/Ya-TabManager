export default {
  "title": "CollectionGroups",
  "version": 0,
  "description": "describes a simple hero",
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 21
    },
    "cid": {
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
    "count": {
      "type": "number",
      "minimum": 0,
      "maximum": 9999,
      default: 0
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
      // default: Date.now() // 不能使用动态数据，schema 只支持静态 json
    },
    "cr": {
      "type": "number",
      "final": true,
      "minimum": 1.68e12,
      "maximum": 2e12,
      // default: Date.now() // 不能使用动态数据，schema 只支持静态 json
    },
  },
  "required": [
    "id",
    "cid",
    "type",
    "name"
  ],
};
