import { Component, inject, model, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionService } from '../../services/question/question.service';

interface CalendarDay {
  date: number;
  month: number; // 0-11, actual month this date belongs to (for prev/next month days)
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  disabled: boolean;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
})
export class CalendarComponent implements OnInit {
  protected readonly questionService = inject(QuestionService);
  protected weekdays = WEEKDAYS;
  protected viewYear!: number;
  protected viewMonth!: number; // 0-11
  protected days: CalendarDay[] = [];
  protected selectedDate: Date | null = null;
  private disabledDates = new Set<string>(); /** Set of disabled dates for the currently loaded month, as 'YYYY-MM-DD' strings. */
  public readonly group = model<Group | null>(null); 
  

  get title(): string {
    return `${MONTH_NAMES[this.viewMonth]} ${this.viewYear}`;
  }

  public ngOnInit(): void {
    const today = new Date();
    this.viewYear = today.getFullYear();
    this.viewMonth = today.getMonth();
    this.loadMonth(this.viewYear, this.viewMonth);
  }

  protected prevMonth(): void {
    this.viewMonth--;
    if (this.viewMonth < 0) {
      this.viewMonth = 11;
      this.viewYear--;
    }
    this.loadMonth(this.viewYear, this.viewMonth);
  }

  protected nextMonth(): void {
    this.viewMonth++;
    if (this.viewMonth > 11) {
      this.viewMonth = 0;
      this.viewYear++;
    }
    this.loadMonth(this.viewYear, this.viewMonth);
  }

  protected selectDay(day: CalendarDay): void {
    if (day.disabled) {
      return;
    }
    this.selectedDate = new Date(day.year, day.month, day.date);
    this.buildDays();
  }

  protected goToToday(): void {
    const today = new Date();
    this.viewYear = today.getFullYear();
    this.viewMonth = today.getMonth();
    this.selectedDate = today;
    this.loadMonth(this.viewYear, this.viewMonth);
  }

  protected clearSelection(): void {
    this.selectedDate = null;
    this.buildDays();
  }

  protected loadMonth(year: number, month: number): void {
    this.fetchQuestionsForDate(year, month);
    this.disabledDates = new Set();
    this.buildDays();
  }

  private async fetchQuestionsForDate(year: number, month: number): Promise<void> {
    try {
      const group = this.group();
      if (!group) throw new Error('Group is not set');
      const questions = await this.questionService.getQuestionByDate(group.id, month + 1, year);
      if (questions) {
        const questionList = Array.isArray(questions) ? questions : [questions];
        const disabledDates = questionList.map(q => {
          const date = new Date(q.date);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        });
        this.setDisabledDates(disabledDates);
      }
    } catch (error) {
      console.error('Error fetching questions for date:', error);
    }
  }

  /** Call this once your API responds, with dates formatted 'YYYY-MM-DD'. */
  protected setDisabledDates(dates: string[]): void {
    this.disabledDates = new Set(dates);
  }

  private buildDays(): void {
    const firstOfMonth = new Date(this.viewYear, this.viewMonth, 1);
    // JS getDay(): 0 = Sunday ... 6 = Saturday. Convert to Monday-first index.
    const firstWeekdayIndex = (firstOfMonth.getDay() + 6) % 7;

    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.viewYear, this.viewMonth, 0).getDate();

    const today = new Date();
    const cells: CalendarDay[] = [];

    // Leading days from previous month
    const prevMonth = this.viewMonth === 0 ? 11 : this.viewMonth - 1;
    const prevYear = this.viewMonth === 0 ? this.viewYear - 1 : this.viewYear;
    for (let i = firstWeekdayIndex - 1; i >= 0; i--) {
      const date = daysInPrevMonth - i;
      cells.push(this.makeCell(date, prevMonth, prevYear, false, today));
    }

    // Current month days
    for (let date = 1; date <= daysInMonth; date++) {
      cells.push(this.makeCell(date, this.viewMonth, this.viewYear, true, today));
    }

    // Trailing days from next month to complete the last week row
    const nextMonth = this.viewMonth === 11 ? 0 : this.viewMonth + 1;
    const nextYear = this.viewMonth === 11 ? this.viewYear + 1 : this.viewYear;
    let nextDate = 1;
    while (cells.length % 7 !== 0) {
      cells.push(this.makeCell(nextDate, nextMonth, nextYear, false, today));
      nextDate++;
    }

    this.days = cells;
  }

  private makeCell(
    date: number,
    month: number,
    year: number,
    isCurrentMonth: boolean,
    today: Date,
  ): CalendarDay {
    const isToday =
      date === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

    const isSelected =
      !!this.selectedDate &&
      date === this.selectedDate.getDate() &&
      month === this.selectedDate.getMonth() &&
      year === this.selectedDate.getFullYear();

    const key = this.toKey(year, month, date);

    return {
      date,
      month,
      year,
      isCurrentMonth,
      isToday,
      isSelected,
      disabled: this.disabledDates.has(key),
    };
  }

  private toKey(year: number, month: number, date: number): string {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(date).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }
}