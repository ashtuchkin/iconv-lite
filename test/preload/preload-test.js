var assert = require('assert').strict,
    fs = require('fs'),
    path = require('path');

// Clear module cache for the module and all submodules it require()-d.
function clearModuleCache(module_name) {
    clearModuleAndChildren(require.cache[require.resolve(module_name)]);
    function clearModuleAndChildren(module) {
        module.children.forEach(clearModuleAndChildren);
        delete require.cache[module.id];
    }
}

describe("iconv-lite library", function() {
    var iconv;
    var original_name = path.join(__dirname, "node_modules", "iconv-lite");
    var temp_name = path.join(__dirname, "node_modules", "not-iconv-lite-but-some-other-module");

    function makeSourceCodeInaccessible() {
        // Rename the package so that it's not available anymore.
        fs.renameSync(original_name, temp_name);
    }
    afterEach(function() {
        // Rename the package back if it was renamed initially.
        if (fs.existsSync(temp_name))
            fs.renameSync(temp_name, original_name);
        clearModuleCache('iconv-lite');
    });

    it("raises exception if sources are removed without preloading", function() {
        iconv = require('iconv-lite');
        makeSourceCodeInaccessible();

        assert.throws(function() {
            iconv.encode("", "utf8");
        }, /Cannot find module/);
    });

    it("works fine if the module is preloaded", function() {
        this.slow(1000);
        iconv = require('iconv-lite');
        iconv.preloadCodecsAndData();
        makeSourceCodeInaccessible();

        // Simple encodings work fine
        assert.equal(iconv.encode("abc", "utf8").toString(), "abc");

        // All other encodings also work fine without exceptions.
        for (var enc in iconv.encodings) {
            if (enc[0] === "_") continue;
            assert.equal(iconv.encode("", enc, {addBOM: false}).toString("hex"), "", enc);
        }

        // Also streaming machinery works fine
        assert.equal(iconv.supportsStreams, true);
        assert.ok(iconv.encodeStream("utf8"));
    });
});
