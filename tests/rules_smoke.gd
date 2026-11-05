extends SceneTree

var failed := false

func _initialize() -> void:
	call_deferred("_run")

func _check(condition: bool, label: String) -> void:
	if condition:
		print("PASS: ", label)
	else:
		push_error("FAIL: " + label)
		failed = true

func _run() -> void:
	var packed := load("res://scenes/main.tscn") as PackedScene
	if packed == null:
		push_error("FAIL: main scene could not be loaded")
		quit(1)
		return

	var game: Variant = packed.instantiate()
	root.add_child(game)
	await process_frame

	# The total ant supply for each color must exactly match the board.
	var board_counts := {"red":0, "blue":0, "yellow":0, "green":0, "purple":0}
	var queue_counts := {"red":0, "blue":0, "yellow":0, "green":0, "purple":0}
	for y in range(game.SIZE):
		for x in range(game.SIZE):
			var pixel_color: String = game.board[y][x]
			if pixel_color != "":
				board_counts[pixel_color] += 1
	for container in game.incoming:
		var container_color: String = str(container.color)
		queue_counts[container_color] += int(container.ants)
	for color in board_counts.keys():
		_check(board_counts[color] == queue_counts[color], "container supply matches " + color + " pixel count")

	# Boundary pixels are always accessible.
	_check(game._is_accessible(0, 0), "board-edge pixel is accessible")

	# A fully surrounded pixel is blocked until one orthogonal neighbor clears.
	for y in range(game.SIZE):
		for x in range(game.SIZE):
			game.board[y][x] = "red"
	_check(not game._is_accessible(3, 3), "surrounded pixel is inaccessible")
	game.board[3][2] = ""
	_check(game._is_accessible(3, 3), "cleared orthogonal neighbor unlocks pixel")

	# Pixel search must return only a matching accessible color.
	for y in range(game.SIZE):
		for x in range(game.SIZE):
			game.board[y][x] = "red"
	game.board[0][0] = "blue"
	var blue_target: Vector2i = game._find_accessible_pixel("blue")
	_check(blue_target == Vector2i(0, 0), "matching accessible pixel is found")
	_check(game._find_accessible_pixel("purple") == Vector2i(-1, -1), "missing color returns no target")

	# Defeat requires five occupied slots and no available matching move.
	for y in range(game.SIZE):
		for x in range(game.SIZE):
			game.board[y][x] = "green"
	game.board[3][3] = "blue"
	game.remaining = game.SIZE * game.SIZE
	game.slots = [
		{"color":"red", "ants":1},
		{"color":"red", "ants":1},
		{"color":"red", "ants":1},
		{"color":"red", "ants":1},
		{"color":"blue", "ants":1}
	]
	_check(not game._is_accessible(3, 3), "interior matching pixel remains blocked")
	_check(game._is_defeat(), "five occupied containers without an accessible match means defeat")
	game.board[3][2] = ""
	_check(not game._is_defeat(), "opening one side of a matching pixel prevents defeat")
	game.board[3][2] = "green"
	game.slots[4] = {"color":"blue", "ants":0}
	_check(game._is_defeat(), "empty container cannot prevent defeat")
	game.slots[0] = null
	_check(not game._is_defeat(), "a free launch slot prevents defeat")
	game.slots[0] = {"color":"red", "ants":1}
	game.remaining = 0
	_check(not game._is_defeat(), "empty board cannot produce defeat")

	# Integration: slots resolve in strict left-to-right order when both can move.
	game.board = []
	for y in range(game.SIZE):
		var row: Array = []
		for x in range(game.SIZE):
			row.append("red")
		game.board.append(row)
	game.board[0][0] = "blue"
	game.slots = [{"color":"blue", "ants":1}, null, null, null, {"color":"red", "ants":1}]
	game.remaining = game.SIZE * game.SIZE
	game.resolution_log.clear()
	await game._resolve_all_slots(false)
	_check(game.resolution_log.size() == 2, "both ready containers collect one pixel")
	_check(game.resolution_log[0].slot == 0 and game.resolution_log[1].slot == 4, "collection trace follows slot order 1 to 5")
	_check(game.slots[0] == null and game.slots[4] == null, "empty containers release their slots")

	# Integration: a blocked early slot gets another turn after a later slot clears its neighbors.
	game.board = []
	for y in range(game.SIZE):
		var row: Array = []
		for x in range(game.SIZE):
			row.append("red")
		game.board.append(row)
	game.board[3][3] = "blue"
	game.slots = [{"color":"blue", "ants":1}, null, null, null, {"color":"red", "ants":48}]
	game.remaining = game.SIZE * game.SIZE
	game.won = false
	game.lost = false
	game.resolution_log.clear()
	await game._resolve_all_slots(false)
	_check(game.resolution_log.size() == game.SIZE * game.SIZE, "later container exposes and clears the final hidden pixel")
	_check(game.resolution_log[0].slot == 4 and game.resolution_log[game.resolution_log.size() - 1].slot == 0, "waiting first slot gets priority on the next resolution pass")
	_check(game.remaining == 0 and game.won, "complete resolution produces victory")

	game.queue_free()
	if failed:
		push_error("Gameplay rules smoke test failed.")
		quit(1)
	else:
		print("Gameplay rules smoke test passed.")
		quit(0)
