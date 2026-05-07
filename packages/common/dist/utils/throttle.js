"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttled = void 0;
const async_mutex_1 = require("async-mutex");
const throttled = (fn, timeout) => {
    const requestMutex = new async_mutex_1.Mutex();
    return (...args) => __awaiter(void 0, void 0, void 0, function* () {
        const release = yield requestMutex.acquire();
        const start = Date.now();
        try {
            return fn(...args);
        }
        finally {
            const elapsed = Date.now() - start;
            setTimeout(release, timeout - elapsed);
        }
    });
};
exports.throttled = throttled;
//# sourceMappingURL=throttle.js.map