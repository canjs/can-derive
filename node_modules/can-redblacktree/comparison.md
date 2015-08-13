### can.List.filter():

Operation | Best | Worst | Avg | Comments
---|---|---|---|---
Insert | O(n) | O(n) | O(n)
Remove | O(n) | O(n) | O(n)
Splice | O(n) | O(n) | O(n)

### can.RedBlackTree.filter():

Operation | Best | Worst | Avg | Comments
---|---|---|---|---
Insert | O(log(n)) | O(log(n)) | O(log(n))
Remove | O(log(n)) | O(log(n)) | O(log(n))
Splice | O(n) | O(n) | O(n) | O(n) due to 1) Avoiding duplicate values in tree (updating subsequent indexes), 2) Predicate function's dependency on the source index <br/> `s.filter(function (item, index) { ... })`

### can.RedBlackTreeList.filter():

Operation | Best | Worst | Avg | Comments
---|---|---|---|---
Insert | O(log^2(n)) | O(log^2(n)) | O(log^2(n))
Remove | O(log^2(n)) | O(log^2(n)) | O(log^2(n))
Splice | O(log^2(n)) | O(n) | O(log^2(n)) | O(n) due to predicate function's dependency on the source index <br/> `s.filter(function (item, index) { ... })`

