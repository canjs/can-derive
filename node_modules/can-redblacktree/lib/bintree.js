var TreeBase = require('./treebase');

function Node(data) {
    this.data = data;
    this.left = null;
    this.right = null;
    this.leftCount = 0;
}

Node.prototype.getChild = function (dir) {
    return dir ? this.right : this.left;
};

Node.prototype.setChild = function (dir, val) {
    if (dir) {
        this.right = val;
    } else {
        this.left = val;
        this.leftCount = val ? val.leftCount + 1 : 0;
    }
};

function BinTree(comparator) {
    this._root = null;
    this._comparator = comparator;
    this.size = 0;
}

BinTree.prototype = new TreeBase();

// Returns true if inserted, false if duplicate
BinTree.prototype.insert = function (data) {
    var index = 0;

    if (this._root === null) {
        // Empty tree
        this._root = new Node(data);
        this.size++;
        return index;
    }

    var dir = 0;

    // Setup
    var p = null; // Parent
    var node = this._root;

    // Search down
    while (true) {
        if (node === null) {
            // Insert new node at the bottom
            node = new Node(data);
            p.setChild(dir, node);
            inserted = true;
            this.size++;
            return index;
        }

        // Stop if found
        if (this._comparator(node.data, data) === 0) {
            return -1;
        }

        dir = this._comparator(node.data, data) < 0;

        // Calculate index as traversing
        if (dir) {
            index += node.leftCount + 1;
        }

        // Update helpers
        p = node;
        node = node.getChild(dir);
    }
};

// Returns true if removed, false if not found
BinTree.prototype.remove = function (data) {
    var index = 0;

    if (this._root === null) {
        return -1;
    }

    var head = new Node(undefined); // Fake tree root
    var node = head;
    node.right = this._root;
    var p = null; // Parent
    var found = null; // Found item
    var dir = 1;

    while (node.getChild(dir) !== null) {
        p = node;
        node = node.getChild(dir);
        var cmp = this._comparator(data, node.data);
        dir = cmp > 0;

        if (cmp === 0) {
            found = node;
        }

        // Calculate index as traversing
        if (dir) {
            index += node.leftCount + 1;
        }
    }

    if (found !== null) {
        found.data = node.data;
        p.setChild(p.right === node, node.getChild(node.left === null));

        this._root = head.right;
        this.size--;
        return index;
    } else {
        return -1;
    }
};

module.exports = BinTree;

