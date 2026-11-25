package com.organizador.escolar.widgets;

import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import com.organizador.escolar.R;

import java.util.ArrayList;
import java.util.List;

/**
 * Servicio y Factory de RemoteViews para poblar la lista del TaskDeadlinesWidget.
 */
public class TaskDeadlinesService extends RemoteViewsService {

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new TaskDeadlinesFactory(this.getApplicationContext());
    }

    static class TaskDeadlinesFactory implements RemoteViewsService.RemoteViewsFactory {

        private final Context context;
        private List<WidgetDataSync.TaskDeadlineItem> items = new ArrayList<>();

        public TaskDeadlinesFactory(Context context) {
            this.context = context;
        }

        @Override
        public void onCreate() {
            loadData();
        }

        @Override
        public void onDataSetChanged() {
            loadData();
        }

        private void loadData() {
            items = WidgetDataSync.getDeadlines(context);
        }

        @Override
        public void onDestroy() {
            items.clear();
        }

        @Override
        public int getCount() {
            return items.size();
        }

        @Override
        public RemoteViews getViewAt(int position) {
            if (position < 0 || position >= items.size()) return null;

            WidgetDataSync.TaskDeadlineItem item = items.get(position);
            RemoteViews row = new RemoteViews(context.getPackageName(), R.layout.widget_task_deadline_item);

            row.setTextViewText(R.id.item_task_title, item.title);
            row.setTextViewText(R.id.item_subject_name, item.subjectName);

            String dueText = item.dueDate + (item.dueTime != null && !item.dueTime.isEmpty() ? " " + item.dueTime : "");
            row.setTextViewText(R.id.item_due_badge, dueText);
            row.setTextViewText(R.id.item_urgency_badge, item.urgencyLabel);
            row.setInt(R.id.item_subject_color_bar, "setBackgroundColor", item.subjectColor);

            Intent fillInIntent = new Intent();
            fillInIntent.putExtra("task_id", item.id);
            row.setOnClickFillInIntent(R.id.widget_deadline_item_root, fillInIntent);

            return row;
        }

        @Override
        public RemoteViews getLoadingView() {
            return null;
        }

        @Override
        public int getViewTypeCount() {
            return 1;
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public boolean hasStableIds() {
            return true;
        }
    }
}
