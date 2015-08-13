function TreeBase() {}

// Removes all nodes from the tree
TreeBase.prototype.clear = function () {
    this._root = null;
    this.size = 0;
};

// Returns node data if found, null otherwise
TreeBase.prototype.find = function (data) {
    var res = this._root;

    while (res !== null) {
        var c = this._comparator(data, res.data);
        if (c === 0) {
            return res.data;
        } else {
            res = res.getChild(c > 0);
        }
    }

    return null;
};

// Returns iterator to node if found, null otherwise
TreeBase.prototype.findIter = function (data) {
    var res = this._root;
    var iter = this.iterator();

    while (res !== null) {
        var c = this._comparator(data, res.data);
        if (c === 0) {
            iter._cursor = res;
            return iter;
        } else {
            iter._ancestors.push(res);
            res = res.getChild(c > 0);
        }
    }

    return null;
};

// Use the leftCount to find the node, not the comparator
TreeBase.prototype.getByIndex = function (searchIndex) {
    var node = this._root;
    var index = -1; // Offset because the first node's `leftCount` IS its index
    var comparator = function (a, b) { return a - b; };
    var dir = true; // Add leftCount initially
    var c;

    while (node !== null) {

        if (dir) {
            index += node.leftCount + 1;
        } else {
            index -= node.rightCount + 1;
        }

        c = comparator(searchIndex, index);

        if (c === 0) {
            return node.data;
        } else {
            dir = c > 0;
            node = node.getChild(dir);
        }
    }

    return null;
};

// Use the comparator to find the index of an item
TreeBase.prototype.indexOf = function (data) {
    var node = this._root;
    var index = 0;
    var c, dir;

    while (node !== null) {
        c = this._comparator(data, node.data);

        dir = c > 0;

        // Calculate index as traversing
        if (c === 0) {
            index += node.leftCount;
            return index;
        } else if (c > 0) {
            index += node.leftCount + 1;
        }

        node = node.getChild(dir);
    }

    return -1;
};

// Returns an iterator to the tree node at or immediately after the item
TreeBase.prototype.lowerBound = function (item) {
    var cur = this._root;
    var iter = this.iterator();
    var cmp = this._comparator;

    while (cur !== null) {
        var c = cmp(item, cur.data);
        if (c === 0) {
            iter._cursor = cur;
            return iter;
        }
        iter._ancestors.push(cur);
        cur = cur.getChild(c > 0);
    }

    for(var i=iter._ancestors.length - 1; i >= 0; --i) {
        cur = iter._ancestors[i];
        if (cmp(item, cur.data) < 0) {
            iter._cursor = cur;
            iter._ancestors.length = i;
            return iter;
        }
    }

    iter._ancestors.length = 0;
    return iter;
};

// Returns an iterator to the tree node immediately after the item
TreeBase.prototype.upperBound = function (item) {
    var iter = this.lowerBound(item);
    var cmp = this._comparator;

    while (cmp(iter.data(), item) === 0) {
        iter.next();
    }

    return iter;
};

// Returns null if tree is empty
TreeBase.prototype.min = function () {
    var res = this._root;
    if (res === null) {
        return null;
    }

    while (res.left !== null) {
        res = res.left;
    }

    return res.data;
};

// Returns null if tree is empty
TreeBase.prototype.max = function () {
    var res = this._root;
    if (res === null) {
        return null;
    }

    while (res.right !== null) {
        res = res.right;
    }

    return res.data;
};

TreeBase.prototype.print = function (valueFn, start, count) {
    var coords = {};
    var lengths = {};
    var graph = '';
    var it = this.iterator();
    var index = 0;
    var maxDepth = 0;
    var maxIndex = 0;
    var depth, key, node, value;

    start = start || 0;

    valueFn = valueFn || function (node) {
        return node.data;
    };

    while (it.next() !== null) {
        if (index >= start && (count >= 0 ? index <= start + count - 1 : true)) {
            depth = it._ancestors.length;
            node = it.node();
            value = String(valueFn.call(this, node));
            coords[index+','+depth] = value;
            lengths[index] = value.length;
            maxIndex = Math.max(maxIndex, index);
            maxDepth = Math.max(maxDepth, depth);
        }
        index++;
    }

    for (var y = 0; y <= maxDepth; y++) {
        for (var x = 0; x <= maxIndex; x++) {
            key = x + ',' + y;
            value = coords[key];
            if (value !== undefined) {
                graph += value;
            } else {
                for (var i = 0; i < lengths[x]; i++) {
                    graph += '-';
                }
            }
        }
        graph += "\n";
    }

    console.log(graph);
};

// Returns a null iterator
// Call next() or prev() to point to an element
TreeBase.prototype.iterator = function () {
    return new Iterator(this);
};

// Calls cb on each node's data, in order
TreeBase.prototype.each = function (cb) {
    var i = 0;
    var it = this.iterator(), data;
    while ((data = it.next()) !== null) {

        // Stop iterating if callback returns false
        if (cb(data, i) === false) {
            break;
        }

        i++;
    }
};

// Calls cb on each node's data, in reverse order
TreeBase.prototype.reach = function (cb) {
    var i = this.size - 1;
    var it = this.iterator(), data;
    while ((data = it.prev()) !== null) {
        cb(data, i);
        i--;
    }
};


function Iterator(tree) {
    this._tree = tree;
    this._ancestors = [];
    this._cursor = null;
}

Iterator.prototype.data = function () {
    return this._cursor !== null ? this._cursor.data : null;
};

Iterator.prototype.node = function () {
    return this._cursor !== null ? this._cursor : null;
};

Iterator.prototype.rest = function (func) {
    var data;

    do {
        data = this.data();

        if (data !== null) {
            func(data);
        }
    } while (this.next() !== null);
};

// If null-iterator, returns first node
// Otherwise, returns next node
Iterator.prototype.next = function () {
    if (this._cursor === null) {
        var root = this._tree._root;
        if (root !== null) {
            this._minNode(root);
        }
    } else {
        if (this._cursor.right === null) {
            // No greater node in subtree, go up to parent
            // If coming from a right child, continue up the stack
            var save;
            do {
                save = this._cursor;
                if (this._ancestors.length) {
                    this._cursor = this._ancestors.pop();
                } else {
                    this._cursor = null;
                    break;
                }
            } while (this._cursor.right === save);
        } else {
            // Get the next node from the subtree
            this._ancestors.push(this._cursor);
            this._minNode(this._cursor.right);
        }
    }
    return this._cursor !== null ? this._cursor.data : null;
};

// If null-iterator, returns last node
// Otherwise, returns previous node
Iterator.prototype.prev = function () {
    if (this._cursor === null) {
        var root = this._tree._root;
        if (root !== null) {
            this._maxNode(root);
        }
    } else {
        if (this._cursor.left === null) {
            var save;
            do {
                save = this._cursor;
                if (this._ancestors.length) {
                    this._cursor = this._ancestors.pop();
                } else {
                    this._cursor = null;
                    break;
                }
            } while (this._cursor.left === save);
        } else {
            this._ancestors.push(this._cursor);
            this._maxNode(this._cursor.left);
        }
    }
    return this._cursor !== null ? this._cursor.data : null;
};

Iterator.prototype._minNode = function (start) {
    while (start.left !== null) {
        this._ancestors.push(start);
        start = start.left;
    }
    this._cursor = start;
};

Iterator.prototype._maxNode = function (start) {
    while (start.right !== null) {
        this._ancestors.push(start);
        start = start.right;
    }
    this._cursor = start;
};

module.exports = TreeBase;

