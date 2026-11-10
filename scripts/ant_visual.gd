extends Control

# Авторский векторный муравей: не зависит от emoji-шрифтов устройства.
# Фаза анимации меняет походку, усики и короткое моргание.
var phase := 0.0

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	queue_redraw()

func _process(delta: float) -> void:
	phase = fposmod(phase + delta * 18.0, TAU * 4.0)
	queue_redraw()

func _draw() -> void:
	var c := Vector2(size.x * 0.5, size.y * 0.5)
	var gait := sin(phase) * 3.0
	var counter_gait := sin(phase + PI) * 3.0
	var antenna := sin(phase * 0.5) * 1.5
	var outline := Color("#17231c")
	var amber := Color("#f2bd62")
	var body := Color("#c96b3d")

	# Тень и шесть лапок: передняя/средняя/задняя пары работают попеременно.
	draw_circle(c + Vector2(0, 7), 7.0, Color(0, 0, 0, 0.2))
	draw_line(c + Vector2(-4, 1), c + Vector2(-11, -8 + gait), outline, 3.0, true)
	draw_line(c + Vector2(-4, 1), c + Vector2(-11, 8 - gait), outline, 3.0, true)
	draw_line(c + Vector2(1, 1), c + Vector2(0, -10 - counter_gait), outline, 2.6, true)
	draw_line(c + Vector2(1, 1), c + Vector2(0, 10 + counter_gait), outline, 2.6, true)
	draw_line(c + Vector2(5, 1), c + Vector2(11, -7 + gait), outline, 2.8, true)
	draw_line(c + Vector2(5, 1), c + Vector2(11, 7 - gait), outline, 2.8, true)

	# Три сегмента тела с тёплым бликом на панцире.
	draw_circle(c + Vector2(-7, 0), 6.2, outline)
	draw_circle(c + Vector2(-7, -0.5), 5.0, Color("#a94f35"))
	draw_circle(c + Vector2(1, 0), 4.2, outline)
	draw_circle(c + Vector2(1, -0.5), 3.2, Color("#d97843"))
	draw_circle(c + Vector2(9, 0), 5.2, outline)
	draw_circle(c + Vector2(9, -0.7), 4.1, body)
	draw_arc(c + Vector2(9, -1), 3.0, PI * 1.15, PI * 1.8, 12, Color("#f3a15c"), 1.1, true)
	draw_circle(c + Vector2(10, -2), 1.3, amber)

	# Усики слегка покачиваются, глаза иногда моргают.
	draw_line(c + Vector2(11, -3), c + Vector2(15, -10 + antenna), outline, 1.8, true)
	draw_line(c + Vector2(11, -3), c + Vector2(19, -7 - antenna), outline, 1.8, true)
	var blink := fposmod(phase, TAU * 3.0) > TAU * 2.92
	if blink:
		draw_line(c + Vector2(9, -2), c + Vector2(12, -2), Color("#fff2cf"), 1.4, true)
	else:
		draw_circle(c + Vector2(10.5, -1.7), 1.0, Color("#fff2cf"))
		draw_circle(c + Vector2(10.8, -1.7), 0.45, outline)
