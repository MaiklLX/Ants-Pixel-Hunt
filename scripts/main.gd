extends Control

const COLORS := {
	"red": Color("#f16b62"),
	"blue": Color("#62a9ed"),
	"yellow": Color("#f4c95d"),
	"green": Color("#65c58b")
}
const COLOR_NAMES := {
	"red": "КРАСНЫЕ",
	"blue": "СИНИЕ",
	"yellow": "ЖЁЛТЫЕ",
	"green": "ЗЕЛЁНЫЕ"
}
const GRID_SIZE := 5
const CELL_SIZE := 48
const MAX_MISTAKES := 3
const ENTRANCE := Vector2i(4, 2)
const DIRECTIONS: Array[Vector2i] = [
	Vector2i(-1, 0), Vector2i(1, 0),
	Vector2i(0, -1), Vector2i(0, 1)
]

# Камни образуют стены. Добыча лежит в узком коридоре от входа:
# красная -> синяя -> жёлтая -> красная.
var level: Array = []
var ant_groups: Array[Dictionary] = []
var mistakes := 0
var remaining := 0
var busy := false
var game_over := false
var won := false

var counter_label: Label
var mistakes_label: Label
var grid_box: GridContainer
var ants_box: GridContainer
var message_label: Label
var restart_button: Button

func _ready() -> void:
	_build_level()
	_build_ui()
	_refresh_all()

func _build_level() -> void:
	level = [
		["rock", "rock", "red", "rock", "rock"],
		["rock", "rock", "yellow", "rock", "rock"],
		["rock", "rock", "blue", "rock", "rock"],
		["rock", "rock", "red", "rock", "rock"],
		["rock", "rock", "", "rock", "rock"]
	]
	ant_groups = [
		{"color": "red", "used": false, "name": "Красный отряд А"},
		{"color": "blue", "used": false, "name": "Синий отряд"},
		{"color": "yellow", "used": false, "name": "Жёлтый отряд"},
		{"color": "red", "used": false, "name": "Красный отряд Б"},
		{"color": "green", "used": false, "name": "Разведчики"}
	]
	mistakes = 0
	remaining = 4
	busy = false
	game_over = false
	won = false

func _build_ui() -> void:
	for child in get_children():
		child.queue_free()

	var background := ColorRect.new()
	background.color = Color("#0e1714")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	var safe := MarginContainer.new()
	safe.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	safe.add_theme_constant_override("margin_left", 18)
	safe.add_theme_constant_override("margin_right", 18)
	safe.add_theme_constant_override("margin_top", 20)
	safe.add_theme_constant_override("margin_bottom", 18)
	add_child(safe)

	var layout := VBoxContainer.new()
	layout.add_theme_constant_override("separation", 10)
	safe.add_child(layout)

	var brand := Label.new()
	brand.text = "🐜  МУРАВЬИШКИ"
	brand.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	brand.add_theme_font_size_override("font_size", 25)
	brand.add_theme_color_override("font_color", Color("#f5d58a"))
	layout.add_child(brand)

	var subtitle := Label.new()
	subtitle.text = "ПИКСЕЛЬНАЯ ОХОТА"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 15)
	subtitle.add_theme_color_override("font_color", Color("#b9c9bd"))
	layout.add_child(subtitle)

	var level_title := Label.new()
	level_title.text = "УРОВЕНЬ 1 · УЗКИЙ ПРОХОД"
	level_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	level_title.add_theme_font_size_override("font_size", 18)
	level_title.add_theme_color_override("font_color", Color.WHITE)
	layout.add_child(level_title)

	counter_label = Label.new()
	counter_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	counter_label.add_theme_font_size_override("font_size", 15)
	counter_label.add_theme_color_override("font_color", Color("#c5d4c9"))
	layout.add_child(counter_label)

	var board_panel := PanelContainer.new()
	var board_style := StyleBoxFlat.new()
	board_style.bg_color = Color("#18251f")
	board_style.set_corner_radius_all(20)
	board_style.content_margin_left = 12
	board_style.content_margin_right = 12
	board_style.content_margin_top = 12
	board_style.content_margin_bottom = 12
	board_panel.add_theme_stylebox_override("panel", board_style)
	board_panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	layout.add_child(board_panel)

	grid_box = GridContainer.new()
	grid_box.columns = GRID_SIZE
	grid_box.add_theme_constant_override("h_separation", 5)
	grid_box.add_theme_constant_override("v_separation", 5)
	board_panel.add_child(grid_box)

	var entrance_label := Label.new()
	entrance_label.text = "ВХОД В МУРАВЕЙНИК  ▼"
	entrance_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	entrance_label.add_theme_font_size_override("font_size", 13)
	entrance_label.add_theme_color_override("font_color", Color("#8bd3a4"))
	layout.add_child(entrance_label)

	var rule_label := Label.new()
	rule_label.text = "Съесть можно только партию, до которой открыт проход."
	rule_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rule_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	rule_label.add_theme_font_size_override("font_size", 13)
	rule_label.add_theme_color_override("font_color", Color("#d5e2d7"))
	layout.add_child(rule_label)

	mistakes_label = Label.new()
	mistakes_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	mistakes_label.add_theme_font_size_override("font_size", 15)
	mistakes_label.add_theme_color_override("font_color", Color("#f5d58a"))
	layout.add_child(mistakes_label)

	message_label = Label.new()
	message_label.text = "Сначала доступна только добыча у входа. Продумай порядок!"
	message_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	message_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	message_label.custom_minimum_size.y = 42
	message_label.add_theme_font_size_override("font_size", 14)
	message_label.add_theme_color_override("font_color", Color("#d5e2d7"))
	layout.add_child(message_label)

	var ant_title := Label.new()
	ant_title.text = "ВЫБЕРИ ОТРЯД"
	ant_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ant_title.add_theme_font_size_override("font_size", 15)
	ant_title.add_theme_color_override("font_color", Color("#d9e3d9"))
	layout.add_child(ant_title)

	ants_box = GridContainer.new()
	ants_box.columns = 2
	ants_box.add_theme_constant_override("h_separation", 8)
	ants_box.add_theme_constant_override("v_separation", 8)
	layout.add_child(ants_box)

	restart_button = Button.new()
	restart_button.text = "↻  Начать заново"
	restart_button.custom_minimum_size = Vector2(0, 48)
	restart_button.add_theme_font_size_override("font_size", 17)
	restart_button.pressed.connect(_restart)
	layout.add_child(restart_button)

func _get_reachable_empty_cells() -> Dictionary:
	var reached: Dictionary = {}
	var queue: Array[Vector2i] = []

	if level[ENTRANCE.y][ENTRANCE.x] != "":
		return reached

	queue.append(ENTRANCE)
	reached[ENTRANCE] = true
	var head := 0
	while head < queue.size():
		var current: Vector2i = queue[head]
		head += 1
		for direction in DIRECTIONS:
			var next_cell: Vector2i = current + direction
			if next_cell.x < 0 or next_cell.x >= GRID_SIZE:
				continue
			if next_cell.y < 0 or next_cell.y >= GRID_SIZE:
				continue
			if reached.has(next_cell):
				continue
			if level[next_cell.y][next_cell.x] != "":
				continue
			reached[next_cell] = true
			queue.append(next_cell)
	return reached

func _get_accessible_batch(color: String) -> Vector2i:
	var reached := _get_reachable_empty_cells()
	for y in range(GRID_SIZE):
		for x in range(GRID_SIZE):
			if level[y][x] != color:
				continue
			var target := Vector2i(x, y)
			for direction in DIRECTIONS:
				if reached.has(target + direction):
					return target
	return Vector2i(-1, -1)

func _refresh_all() -> void:
	if not is_instance_valid(grid_box):
		return

	for child in grid_box.get_children():
		child.queue_free()

	var reached := _get_reachable_empty_cells()
	for y in range(GRID_SIZE):
		for x in range(GRID_SIZE):
			var cell := Panel.new()
			cell.custom_minimum_size = Vector2(CELL_SIZE, CELL_SIZE)
			var style := StyleBoxFlat.new()
			var value: String = level[y][x]
			if value == "rock":
				style.bg_color = Color("#34423b")
				style.border_color = Color("#52645a")
			elif value == "":
				style.bg_color = Color("#1c3027") if reached.has(Vector2i(x, y)) else Color("#26352e")
				style.border_color = Color("#42634f")
			else:
				style.bg_color = COLORS[value]
				var target := Vector2i(x, y)
				var is_accessible := false
				for direction in DIRECTIONS:
					if reached.has(target + direction):
						is_accessible = true
				style.border_color = Color("#fff0b2") if is_accessible else COLORS[value].darkened(0.55)
			style.set_border_width_all(3 if value != "rock" and value != "" else 1)
			style.set_corner_radius_all(7)
			cell.add_theme_stylebox_override("panel", style)
			grid_box.add_child(cell)

	for child in ants_box.get_children():
		child.queue_free()
	for i in range(ant_groups.size()):
		var group: Dictionary = ant_groups[i]
		var color: String = group.color
		var button := Button.new()
		button.custom_minimum_size = Vector2(142, 58)
		button.disabled = group.used or busy or game_over
		var group_title: String = group.name
		button.text = "🐜  " + group_title + "\n" + COLOR_NAMES[color]
		button.add_theme_font_size_override("font_size", 12)
		var normal := StyleBoxFlat.new()
		normal.bg_color = COLORS[color].darkened(0.58)
		normal.set_corner_radius_all(12)
		normal.set_border_width_all(2)
		normal.border_color = COLORS[color]
		button.add_theme_stylebox_override("normal", normal)
		button.add_theme_stylebox_override("disabled", normal)
		button.pressed.connect(_select_group.bind(i))
		ants_box.add_child(button)

	counter_label.text = "Осталось партий: %d" % remaining
	mistakes_label.text = "Ошибки: %d / %d" % [mistakes, MAX_MISTAKES]
	if won:
		message_label.text = "Победа! Ты открыл весь проход! ✨"
	elif game_over:
		message_label.text = "Три ошибки! Муравьишки запутались. Попробуй ещё раз."

func _select_group(index: int) -> void:
	if busy or game_over or won or index < 0 or index >= ant_groups.size():
		return

	var group: Dictionary = ant_groups[index]
	if group.used:
		return

	var target := _get_accessible_batch(group.color)
	group.used = true
	ant_groups[index] = group
	busy = true

	if target.x < 0:
		mistakes += 1
		message_label.text = "Проход закрыт или такой добычи сейчас нет. Потерян ход!"
		_refresh_all()
		await get_tree().create_timer(0.35).timeout
		busy = false
		if mistakes >= MAX_MISTAKES:
			game_over = true
			message_label.text = "Три ошибки! Муравьишки запутались. Попробуй ещё раз."
		_refresh_all()
		return

	message_label.text = "Отряд нашёл свою партию! Прокладываем путь…"
	_refresh_all()
	await get_tree().create_timer(0.35).timeout
	level[target.y][target.x] = ""
	remaining -= 1
	busy = false

	if remaining == 0:
		won = true
		message_label.text = "Победа! Ты открыл весь проход! ✨"
	else:
		message_label.text = "Путь изменился. Посмотри, какая партия открылась теперь."
	_refresh_all()

func _restart() -> void:
	_build_level()
	_build_ui()
	_refresh_all()
