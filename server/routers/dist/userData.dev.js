"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = _interopRequireDefault(require("express"));

var _auth = _interopRequireDefault(require("../middleware/auth.js"));

var _userData = _interopRequireDefault(require("../controller/userData.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var router = _express["default"].Router();

router.get('/allLogs', _auth["default"], _userData["default"].onGetAllLogsById) // .get('/log', userData.onCreateLogById)
.post('/generate-image', _auth["default"], _userData["default"].onGenerateImage) // /.post('/generate-weekly-image', auth, userData.onGenerateWeeklyImage)
.post('/save-memo', _auth["default"], _userData["default"].onSaveMemo);
var _default = router;
exports["default"] = _default;