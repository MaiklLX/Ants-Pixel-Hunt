extends Control

# Авторский векторный муравей: не зависит от emoji-шрифтов устройства.
var phase := 0.0

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	queue_redraw()

func _process(delta: float) -> void:
	phase += delta * 18.0
	queue_redraw()

func _draw() -> void:
	var c := Vector2(size.x * 0.5, size.y * 0.5)
	var swing := sin(phase) * 3.0
	var outline := Color("#17231c")
	var amber := Color("#f2bd62")

	# Мягкая тень и три сегмента тела.
	draw_circle(c + Vector2(0, 7), 7.0, Color(0, 0, 0, 0.22))
	draw_line(c + Vector2(-3, 1), c + Vector2(-10, -8 + swing), outline, 3.0, true)
	draw_line(c + Vector2(-3, 1), c + Vector2(-10, 8 - swing), outline, 3.0, true)
	draw_line(c + Vector2(1, 1), c + Vector2(0, -10 - swing), outline, 2.6, true)
	draw_line(c + Vector2(1, 1), c + Vector2(0, 10 + swing), outline, 2.6, true)
	draw_line(c + Vector2(5, 1), c + Vector2(10, -7 + swing), outline, 2.8, true)
	draw_line(c + Vector2(5, 1), c + Vector2(10, 7 - swing), outline, 2.8, true)

	draw_circle(c + Vector2(-7, 0), 6.2, outline)
	draw_circle(c + Vector2(-7, -0.5), 5.0, Color("#a94f35"))
	draw_circle(c + Vector2(1, 0), 4.2, outline)
	draw_circle(c + Vector2(1, -0.5), 3.2, Color("#d97843"))
	draw_circle(c + Vector2(9, 0), 5.2, outline)
	draw_circle(c + Vector2(9, -0.7), 4.1, Color("#c96b3d"))
	draw_circle(c + Vector2(10, -2), 1.3, amber)

	# Усики и выразительные глаза.
	draw_line(c + Vector2(11, -3), c + Vector2(15, -10), outline, 1.8, true)
	draw_line(c + Vector2(11, -3), c + Vector2(19, -7), outline, 1.8, true)
	draw_circle(c + Vector2(10.5, -1.7), 1.0, Color("#fff2cf"))
	draw_circle(c + Vector2(10.8, -1.7), 0.45, outline)
